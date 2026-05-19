import type { Hash, WalletClient } from "viem";
import { sendTransaction as sendZksyncTransaction } from "viem/zksync";

type BigIntString = string;
type BlockchainData = `0x${string}`;
type EvmAddress = `0x${string}`;

type Eip712Raw = {
  __typename: "Eip712TransactionRequest";
  type: number;
  to: EvmAddress;
  from: EvmAddress;
  nonce: number;
  gasLimit: number;
  maxFeePerGas: BigIntString;
  maxPriorityFeePerGas: BigIntString;
  data: BlockchainData;
  value: BigIntString;
  chainId: number;
  customData: {
    __typename: "Eip712Meta";
    gasPerPubdata: BigIntString;
    factoryDeps: BlockchainData[];
    customSignature: BlockchainData | null;
    paymasterParams: {
      __typename: "PaymasterParams";
      paymaster: EvmAddress;
      paymasterInput: BlockchainData;
    } | null;
  };
};

type Eip1559Raw = {
  __typename: "Eip1559TransactionRequest";
  type: number;
  from: EvmAddress;
  to: EvmAddress;
  nonce: number;
  gasLimit: number;
  maxPriorityFeePerGas: BigIntString;
  maxFeePerGas: BigIntString;
  data: BlockchainData;
  value: BigIntString;
  chainId: number;
};

export type LensExecutePostActionResult =
  | { __typename: "ExecutePostActionResponse"; hash: Hash }
  | {
      __typename: "SponsoredTransactionRequest";
      reason: string;
      sponsoredReason?: string;
      raw: Eip712Raw;
    }
  | {
      __typename: "SelfFundedTransactionRequest";
      reason: string;
      selfFundedReason?: string;
      raw: Eip1559Raw;
    }
  | { __typename: "TransactionWillFail"; reason: string };

export class LensActionRevertError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(`Lens action will revert: ${reason}`);
    this.name = "LensActionRevertError";
    this.reason = reason;
  }
}

function assertNever(value: never): never {
  throw new Error(`Unknown Lens action result type: ${JSON.stringify(value)}`);
}

function debug(...args: unknown[]) {
  if (process.env.NEXT_PUBLIC_VR303_DEBUG === "1") {
    // eslint-disable-next-line no-console
    console.debug("[dispatchLensResult]", ...args);
  }
}

export async function dispatchLensResult(
  result: LensExecutePostActionResult,
  walletClient: WalletClient,
): Promise<Hash> {
  debug("incoming", result.__typename);

  switch (result.__typename) {
    case "ExecutePostActionResponse":
      return result.hash;

    case "TransactionWillFail":
      throw new LensActionRevertError(result.reason);

    case "SelfFundedTransactionRequest": {
      const raw = result.raw;
      if (!walletClient.account) {
        throw new Error("walletClient is missing an account");
      }
      const tx = {
        account: walletClient.account,
        chain: walletClient.chain,
        from: raw.from,
        to: raw.to,
        data: raw.data,
        value: BigInt(raw.value),
        gas: BigInt(raw.gasLimit),
        nonce: raw.nonce,
        maxFeePerGas: BigInt(raw.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(raw.maxPriorityFeePerGas),
        type: "eip1559" as const,
      };
      return sendZksyncTransaction(
        walletClient,
        tx as unknown as Parameters<WalletClient["sendTransaction"]>[0],
      );
    }

    case "SponsoredTransactionRequest": {
      const raw = result.raw;
      const paymaster = raw.customData.paymasterParams;
      if (!walletClient.account) {
        throw new Error("walletClient is missing an account");
      }
      const tx = {
        account: walletClient.account,
        chain: walletClient.chain,
        from: raw.from,
        to: raw.to,
        data: raw.data,
        value: BigInt(raw.value),
        gas: BigInt(raw.gasLimit),
        nonce: raw.nonce,
        maxFeePerGas: BigInt(raw.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(raw.maxPriorityFeePerGas),
        type: "eip712" as const,
        gasPerPubdata: BigInt(raw.customData.gasPerPubdata),
        factoryDeps: raw.customData.factoryDeps,
        customSignature: raw.customData.customSignature ?? undefined,
        paymaster: paymaster ? paymaster.paymaster : undefined,
        paymasterInput: paymaster ? paymaster.paymasterInput : undefined,
      };
      return sendZksyncTransaction(
        walletClient,
        tx as unknown as Parameters<WalletClient["sendTransaction"]>[0],
      );
    }

    default:
      return assertNever(result);
  }
}
