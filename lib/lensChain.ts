import { defineChain, type Address } from "viem";
import { chainConfig } from "viem/zksync";

const lensProductionChain = defineChain({
  ...chainConfig,
  id: 232,
  name: "Lens",
  nativeCurrency: { name: "GHO", symbol: "GHO", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.lens.xyz"] } },
  blockExplorers: { default: { name: "Lenscan", url: "https://scan.lens.xyz" } },
});

export const lensMainnet = lensProductionChain;

// Server-only: always the real Lens mainnet.
// The collectors API reads on-chain state from the real deploy, not from a local node.
export const lensServerChain = lensProductionChain;

export const CONTRACT = "0x303AC1D2736C70A9BaE4FC46aAe1c6Ed41C629Af" as Address;
export const CONTRACT_SHORT = "0x303A...29Af";

// Server-only contract address: always the real Lens mainnet deploy.
export const SERVER_CONTRACT =
  "0x303AC1D2736C70A9BaE4FC46aAe1c6Ed41C629Af" as Address;
