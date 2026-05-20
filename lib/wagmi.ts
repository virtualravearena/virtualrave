import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "@wagmi/connectors";
import { lensMainnet, CONTRACT, CONTRACT_SHORT } from "@/lib/lensChain";

export { lensMainnet, CONTRACT, CONTRACT_SHORT };

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
