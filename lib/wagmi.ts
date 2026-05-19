import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "@wagmi/connectors";
import { defineChain, type Address } from "viem";
import { chainConfig } from "viem/zksync";

const localChainMode = process.env.NEXT_PUBLIC_VR303_CHAIN_MODE === "local";
const localChainId = Number(process.env.NEXT_PUBLIC_VR303_CHAIN_ID ?? "31337");
const localRpcUrl = process.env.NEXT_PUBLIC_VR303_RPC_URL ?? "http://127.0.0.1:8545";

const lensProductionChain = defineChain({
  ...chainConfig,
  id: 232,
  name: "Lens",
  nativeCurrency: { name: "GHO", symbol: "GHO", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.lens.xyz"] } },
  blockExplorers: { default: { name: "Lenscan", url: "https://scan.lens.xyz" } },
});

const localChain = defineChain({
  id: localChainId,
  name: "VR303 Local",
  nativeCurrency: { name: "Local GHO", symbol: "GHO", decimals: 18 },
  rpcUrls: { default: { http: [localRpcUrl] } },
});

export const lensMainnet = localChainMode ? localChain : lensProductionChain;

export const CONTRACT =
  (process.env.NEXT_PUBLIC_VR303_CONTRACT ??
    "0x303AC1D2736C70A9BaE4FC46aAe1c6Ed41C629Af") as Address;
export const CONTRACT_SHORT = "0x303A...29Af";

let clientConfig: ReturnType<typeof createConfig> | undefined;
let serverConfig: ReturnType<typeof createConfig> | undefined;

export function makeWagmiConfig() {
  const isBrowser = typeof window !== "undefined";

  if (isBrowser && clientConfig) return clientConfig;
  if (!isBrowser && serverConfig) return serverConfig;

  const config = createConfig({
    chains: [lensMainnet],
    connectors: isBrowser
      ? [
          injected(),
          ...(process.env.NEXT_PUBLIC_WC_PROJECT_ID
            ? [
                walletConnect({
                  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
                  showQrModal: true,
                }),
              ]
            : []),
        ]
      : [],
    ssr: true,
    transports: { [lensMainnet.id]: http(lensMainnet.rpcUrls.default.http[0]) },
  });

  if (isBrowser) {
    clientConfig = config;
  } else {
    serverConfig = config;
  }

  return config;
}
