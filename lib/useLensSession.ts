"use client";

import { useCallback, useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
import { getAddress, isAddress } from "viem";
import { InMemoryStorageProvider } from "@lens-protocol/storage";
import { PublicClient, evmAddress, mainnet, type SessionClient } from "@lens-protocol/client";
import { signMessageWith } from "@lens-protocol/client/viem";
import { lensMainnet } from "./wagmi";
import { getLensPublicClient, LENS_APP_ID } from "./lensClient";
import { orbLogin } from "./orbLogin";
import type { OrbSession } from "@/components/OrbLoginPanel";

type LensSessionStatus = "idle" | "authenticating" | "authenticated" | "error";

interface UseLensSessionResult {
  sessionClient: SessionClient | null;
  status: LensSessionStatus;
  error: string | null;
  needsReauth: boolean;
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

const orb = orbLogin;

function getStringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

type OrbResumeResult = {
  client: SessionClient | null;
  needsReauth: boolean;
};

async function resumeSessionFromOrb(orbSession: OrbSession | null): Promise<OrbResumeResult> {
  const accessToken = getStringField(orbSession?.accessToken);
  const idToken = getStringField(orbSession?.idToken);

  if (!accessToken) return { client: null, needsReauth: false };

  const synced = await orb.syncSession({
    accessToken,
    ...(idToken ? { idToken } : {}),
  });

  if (!synced?.accessToken || !synced.idToken) {
    return { client: null, needsReauth: true };
  }

  const storage = new InMemoryStorageProvider();
  const now = Date.now();
  storage.setItem(
    "lens.mainnet.credentials",
    JSON.stringify({
      data: {
        accessToken: synced.accessToken,
        idToken: synced.idToken,
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

  return result.isOk()
    ? { client: result.value, needsReauth: false }
    : { client: null, needsReauth: true };
}

export function useLensSession(orbSession: OrbSession | null): UseLensSessionResult {
  const { data: walletClient } = useWalletClient({ chainId: lensMainnet.id });
  const [sessionClient, setSessionClient] = useState<SessionClient | null>(null);
  const [status, setStatus] = useState<LensSessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);

  const candidate = orbSession?.userId ?? orbSession?.account ?? null;
  const lensAccountAddress =
    candidate && isAddress(candidate) ? getAddress(candidate) : null;
  const signerAddress = walletClient?.account.address ?? null;

  useEffect(() => {
    if (!lensAccountAddress) {
      setSessionClient(null);
      setStatus("idle");
      setError(null);
      setNeedsReauth(false);
    }
  }, [lensAccountAddress]);

  const login = useCallback(async () => {
    if (!lensAccountAddress) return null;
    if (sessionClient) return sessionClient;

    setStatus("authenticating");
    setError(null);
    setNeedsReauth(false);

    try {
      const orbResume = await resumeSessionFromOrb(orbSession);
      if (orbResume.client) {
        setSessionClient(orbResume.client);
        setStatus("authenticated");
        return orbResume.client;
      }
      if (orbResume.needsReauth) {
        setSessionClient(null);
        setNeedsReauth(true);
        setStatus("error");
        setError("Orb session expired. Scan Orb again.");
        return null;
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
    setNeedsReauth(false);
  }, []);

  return { sessionClient, status, error, needsReauth, login, logout };
}
