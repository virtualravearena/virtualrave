import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // @wagmi/connectors bundles MetaMask SDK which requires React Native storage
    // and WalletConnect which requires pino-pretty — neither exists in this env.
    // Alias them to false (empty module) so webpack stops complaining.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;
