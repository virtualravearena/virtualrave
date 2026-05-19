import {
  blockchainData,
  evmAddress,
  postId,
  type BlockchainData,
  type EvmAddress,
  type PostId,
} from "@lens-protocol/client";
import {
  encodeAbiParameters,
  formatUnits,
  getAddress,
  isAddress,
  keccak256,
  parseUnits,
  toBytes,
  type Address,
  type Hex,
} from "viem";

export const VR303_CONTRACT = "0x303AC1D2736C70A9BaE4FC46aAe1c6Ed41C629Af" as const;
export const VR303_MINT_POST_ACTION =
  "0x303feeD7e375080e9dBF16e6DD214122BA31A6bd" as const;

export const VR303_PRICE_WEI = parseUnits("1", 18);
export const LENS_TREASURY_FEE_BPS = 150n;
export const BPS_DENOMINATOR = 10_000n;

export const PARAM_QUANTITY = keccak256(toBytes("vr303.quantity"));
export const PARAM_RECEIVER = keccak256(toBytes("vr303.receiver"));
export const PARAM_PROOF = keccak256(toBytes("vr303.proof"));

export type LensActionParam = {
  key: BlockchainData;
  data: BlockchainData;
};

type BuildMintParamsInput = {
  quantity: number;
  receiver?: Address | null;
  proof?: Hex[];
};

export function getVr303PostId(): PostId {
  const configured = process.env.NEXT_PUBLIC_VR303_POST_ID?.trim();

  if (!configured) {
    throw new Error("Set NEXT_PUBLIC_VR303_POST_ID to the Lens post id for VR303.");
  }

  return postId(configured);
}

export function getVr303MintPostAction(): EvmAddress {
  return evmAddress(VR303_MINT_POST_ACTION);
}

export function normalizeOptionalReceiver(receiver?: string | null): Address | null {
  if (!receiver) return null;
  return isAddress(receiver) ? getAddress(receiver) : null;
}

export function getNetMintCostWei(quantity: number): bigint {
  return VR303_PRICE_WEI * BigInt(quantity);
}

export function getGrossMintCostWei(quantity: number): bigint {
  const net = getNetMintCostWei(quantity);
  const feeDenominator = BPS_DENOMINATOR - LENS_TREASURY_FEE_BPS;

  return (net * BPS_DENOMINATOR + feeDenominator - 1n) / feeDenominator;
}

export function formatGhoAmount(value: bigint, fractionDigits = 4) {
  const [whole, fraction = ""] = formatUnits(value, 18).split(".");
  const trimmed = fraction.slice(0, fractionDigits).replace(/0+$/, "");

  return trimmed ? `${whole}.${trimmed}` : whole;
}

export function buildVr303MintParams({
  quantity,
  receiver,
  proof = [],
}: BuildMintParamsInput): LensActionParam[] {
  const params: LensActionParam[] = [
    {
      key: blockchainData(PARAM_QUANTITY),
      data: blockchainData(
        encodeAbiParameters([{ name: "quantity", type: "uint256" }], [BigInt(quantity)])
      ),
    },
  ];

  if (receiver) {
    params.push({
      key: blockchainData(PARAM_RECEIVER),
      data: blockchainData(
        encodeAbiParameters([{ name: "receiver", type: "address" }], [receiver])
      ),
    });
  }

  if (proof.length > 0) {
    params.push({
      key: blockchainData(PARAM_PROOF),
      data: blockchainData(
        encodeAbiParameters([{ name: "proof", type: "bytes32[]" }], [proof])
      ),
    });
  }

  return params;
}
