import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "@wagmi/connectors";
import { defineChain } from "viem";
import { chainConfig } from "viem/zksync";

export const lensMainnet = defineChain({
  ...chainConfig,
  id: 232,
  name: "Lens",
  nativeCurrency: { name: "GHO", symbol: "GHO", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.lens.xyz"] } },
  blockExplorers: { default: { name: "Lenscan", url: "https://scan.lens.xyz" } },
});

export const CONTRACT = "0x303AC1D2736C70A9BaE4FC46aAe1c6Ed41C629Af";
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
    transports: { [lensMainnet.id]: http() },
  });

  if (isBrowser) {
    clientConfig = config;
  } else {
    serverConfig = config;
  }

  return config;
}
