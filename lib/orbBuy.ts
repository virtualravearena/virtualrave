import type { Address, Hash, Hex, WalletClient } from "viem";
import { sendTransaction as sendZksyncTransaction } from "viem/zksync";

export const DEFAULT_ORB_BUY_ENDPOINT = "/api/orb/buy";

export type OrbBuyInput = {
  account: Address;
  signer: Address;
  quantity: number;
  receiver?: Address | null;
  accessToken?: string | null;
};

export type OrbBuyTransaction = {
  to: Address;
  data: Hex;
  amount?: string;
  value?: string;
  chainId: number;
  gasLimit: number | string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  nonce: number;
  gasPerPubdata?: string;
  factoryDeps?: Hex[];
  customSignature?: Hex | null;
  paymaster?: Address | null;
  paymasterInput?: Hex | null;
};

type OrbBuySuccess = {
  status: "SUCCESS";
  data: {
    type: "TRANSACTIONS";
    transactions: OrbBuyTransaction[];
    product?: string;
    account?: Address;
    signer?: Address;
    receiver?: Address | null;
    quantity?: number;
    value?: string;
    authority?: string;
  };
};

type OrbBuyFailure = {
  status: "FAILED";
  msg?: string;
  error?: string;
  data?: unknown;
};

type OrbBuyResponse = OrbBuySuccess | OrbBuyFailure;

export class OrbBuyError extends Error {
  readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "OrbBuyError";
    this.details = details;
  }
}

export function getOrbBuyEndpoint() {
  return process.env.NEXT_PUBLIC_ORB_BUY_ENDPOINT?.trim() || DEFAULT_ORB_BUY_ENDPOINT;
}

export function buildOrbBuyRequest({ account, signer, quantity, receiver }: OrbBuyInput) {
  return {
    product: "vr303",
    account,
    signer,
    quantity,
    ...(receiver ? { receiver } : {}),
  };
}

function getAccessTokenHeader(accessToken?: string | null) {
  const token = accessToken?.trim();
  if (!token) return null;
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

function getFailureMessage(response: Response, payload: OrbBuyResponse | null) {
  if (payload?.status === "FAILED" && typeof payload.msg === "string") {
    return payload.msg;
  }
  if (payload?.status === "FAILED" && typeof payload.error === "string") {
    return payload.error;
  }
  return `Orb buy request failed (${response.status})`;
}

export async function requestOrbBuyTransaction(
  input: OrbBuyInput,
  options: { endpoint?: string; fetchImpl?: typeof fetch } = {},
) {
  const endpoint = options.endpoint || getOrbBuyEndpoint();
  const fetchImpl = options.fetchImpl || fetch;
  const accessTokenHeader = getAccessTokenHeader(input.accessToken);
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(accessTokenHeader ? { "x-access-token": accessTokenHeader } : {}),
    },
    body: JSON.stringify(buildOrbBuyRequest(input)),
  });

  const payload = (await response.json().catch(() => null)) as OrbBuyResponse | null;
  if (!response.ok || payload?.status !== "SUCCESS") {
    throw new OrbBuyError(getFailureMessage(response, payload), payload);
  }

  const transaction = payload.data.transactions[0];
  if (!transaction) {
    throw new OrbBuyError("Orb buy route did not return a transaction.", payload);
  }

  return { payload, transaction };
}

export async function dispatchOrbSponsoredTransaction(
  transaction: OrbBuyTransaction,
  walletClient: WalletClient,
): Promise<Hash> {
  if (!walletClient.account) {
    throw new Error("walletClient is missing an account");
  }
  if (!transaction.paymaster || !transaction.paymasterInput) {
    throw new OrbBuyError("Orb buy transaction was not sponsored.", transaction);
  }

  const tx = {
    account: walletClient.account,
    chain: walletClient.chain,
    to: transaction.to,
    data: transaction.data,
    value: BigInt(transaction.amount ?? transaction.value ?? "0"),
    gas: BigInt(transaction.gasLimit),
    nonce: transaction.nonce,
    maxFeePerGas: BigInt(transaction.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas),
    type: "eip712" as const,
    gasPerPubdata: BigInt(transaction.gasPerPubdata || "50000"),
    factoryDeps: transaction.factoryDeps || [],
    customSignature: transaction.customSignature || undefined,
    paymaster: transaction.paymaster,
    paymasterInput: transaction.paymasterInput,
  };

  return sendZksyncTransaction(
    walletClient,
    tx as unknown as Parameters<WalletClient["sendTransaction"]>[0],
  );
}
