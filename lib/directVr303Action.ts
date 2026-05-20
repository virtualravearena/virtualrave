import { type Address, type Hex } from "viem";
import { buildVr303MintParams, VR303_MINT_POST_ACTION } from "./vr303Action";

export const LENS_ACTION_HUB =
  (process.env.NEXT_PUBLIC_LENS_ACTION_HUB ??
    "0xc6d57ee750ef2ee017a9e985a0c4198bed16a802") as Address;

export const LENS_FEED =
  (process.env.NEXT_PUBLIC_LENS_FEED ??
    "0xcB5E109FFC0E15565082d78E68dDDf2573703580") as Address;

const DEFAULT_VR303_POST_ID =
  "55511693925075680587363221348532051036976508387574587068586899833679963671948";

export const ACTION_HUB_ABI = [
  {
    name: "executePostAction",
    type: "function",
    inputs: [
      { name: "action", type: "address" },
      { name: "feed", type: "address" },
      { name: "postId", type: "uint256" },
      {
        name: "params",
        type: "tuple[]",
        components: [
          { name: "key", type: "bytes32" },
          { name: "value", type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "", type: "bytes" }],
    stateMutability: "payable",
  },
] as const;

export function getVr303PostIdBigInt() {
  return BigInt(process.env.NEXT_PUBLIC_VR303_POST_ID?.trim() || DEFAULT_VR303_POST_ID);
}

export function buildDirectVr303ActionArgs({
  quantity,
  receiver,
}: {
  quantity: number;
  receiver: Address;
}) {
  const params = buildVr303MintParams({ quantity, receiver }).map((param) => ({
    key: param.key as Hex,
    value: param.data as Hex,
  }));

  return [
    VR303_MINT_POST_ACTION,
    LENS_FEED,
    getVr303PostIdBigInt(),
    params,
  ] as const;
}
