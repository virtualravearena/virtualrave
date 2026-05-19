"use client";

import { useCallback, useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
import { getAddress, isAddress } from "viem";
import { InMemoryStorageProvider } from "@lens-protocol/storage";
import { PublicClient, evmAddress, mainnet, type SessionClient } from "@lens-protocol/client";
import { signMessageWith } from "@lens-protocol/client/viem";
import { createOrbLogin } from "@orbclub/modules/auth";
import { lensMainnet } from "./wagmi";
import { getLensPublicClient, LENS_APP_ID } from "./lensClient";
import type { OrbSession } from "@/components/OrbLoginPanel";

type LensSessionStatus = "idle" | "authenticating" | "authenticated" | "error";

interface UseLensSessionResult {
  sessionClient: SessionClient | null;
  status: LensSessionStatus;
  error: string | null;
  login: () => Promise<SessionClient | null>;
  logout: () => void;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

const orb = createOrbLogin();

function getStringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

async function resumeSessionFromOrb(orbSession: OrbSession | null) {
  const accessToken = getStringField(orbSession?.accessToken);
  const refreshToken = getStringField(orbSession?.refreshToken);
  let idToken = getStringField(orbSession?.idToken);
  let nextAccessToken = accessToken;
  let nextRefreshToken = refreshToken;

  if (!nextAccessToken || !nextRefreshToken) return null;

  if (!idToken && nextRefreshToken) {
    const refreshed = await orb.refresh({ refreshToken: nextRefreshToken });
    nextAccessToken = getStringField(refreshed.accessToken) ?? nextAccessToken;
    nextRefreshToken = getStringField(refreshed.refreshToken) ?? nextRefreshToken;
    idToken = getStringField(refreshed.idToken) ?? idToken;
  }

  if (!nextAccessToken || !nextRefreshToken || !idToken) return null;

  const storage = new InMemoryStorageProvider();
  const now = Date.now();
  storage.setItem(
    "lens.mainnet.credentials",
    JSON.stringify({
      data: {
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
        idToken,
      },
      metadata: {
        version: 3,
        createdAt: now,
        updatedAt: now,
      },
    }),
  );

  const publicClient = PublicClient.create({
    environment: mainnet,
    origin: typeof window !== "undefined" ? window.location.origin : "https://vr303.local",
    storage,
  });
  const result = await publicClient.resumeSession();

  return result.isOk() ? result.value : null;
}

export function useLensSession(orbSession: OrbSession | null): UseLensSessionResult {
  const { data: walletClient } = useWalletClient({ chainId: lensMainnet.id });
  const [sessionClient, setSessionClient] = useState<SessionClient | null>(null);
  const [status, setStatus] = useState<LensSessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const candidate = orbSession?.userId ?? orbSession?.account ?? null;
  const lensAccountAddress =
    candidate && isAddress(candidate) ? getAddress(candidate) : null;
  const signerAddress = walletClient?.account.address ?? null;

  useEffect(() => {
    if (!lensAccountAddress) {
      setSessionClient(null);
      setStatus("idle");
      setError(null);
    }
  }, [lensAccountAddress]);

  const login = useCallback(async () => {
    if (!lensAccountAddress) return null;
    if (sessionClient) return sessionClient;

    setStatus("authenticating");
    setError(null);

    try {
      const orbClient = await resumeSessionFromOrb(orbSession);
      if (orbClient) {
        setSessionClient(orbClient);
        setStatus("authenticated");
        return orbClient;
      }
    } catch (err) {
      setError(errorMessage(err));
    }

    if (!walletClient) {
      setStatus("idle");
      return null;
    }

    const publicClient = getLensPublicClient();
    const signer = walletClient.account.address;
    const sign = signMessageWith(walletClient);

    const ownerResult = await publicClient.login({
      accountOwner: {
        account: evmAddress(lensAccountAddress),
        owner: evmAddress(signer),
        app: evmAddress(LENS_APP_ID),
      },
      signMessage: sign,
    });

    if (ownerResult.isOk()) {
      const client = ownerResult.value;
      setSessionClient(client);
      setStatus("authenticated");
      return client;
    }

    const managerResult = await publicClient.login({
      accountManager: {
        account: evmAddress(lensAccountAddress),
        manager: evmAddress(signer),
        app: evmAddress(LENS_APP_ID),
      },
      signMessage: sign,
    });

    if (managerResult.isOk()) {
      const client = managerResult.value;
      setSessionClient(client);
      setStatus("authenticated");
      return client;
    }

    const msg = `${errorMessage(ownerResult.error)} / ${errorMessage(managerResult.error)}`;
    setStatus("error");
    setError(msg);
    return null;
  }, [walletClient, lensAccountAddress, sessionClient, orbSession]);

  const logout = useCallback(() => {
    setSessionClient(null);
    setStatus("idle");
    setError(null);
  }, []);

  return { sessionClient, status, error, login, logout };
}
