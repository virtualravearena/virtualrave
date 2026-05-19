import { PublicClient, mainnet } from "@lens-protocol/client";

const DEFAULT_APP_ID = "0x89722F8D89CE9558ada37C2B417c77430Ee05980";
const RAW_APP_ID = (process.env.NEXT_PUBLIC_LENS_APP_ID ?? DEFAULT_APP_ID).trim();

export const LENS_APP_ID = RAW_APP_ID as `0x${string}`;

let clientInstance: PublicClient | undefined;
let serverInstance: PublicClient | undefined;

export function getLensPublicClient(): PublicClient {
  if (!RAW_APP_ID) {
    throw new Error("Set NEXT_PUBLIC_LENS_APP_ID to your registered Lens App address.");
  }

  const isBrowser = typeof window !== "undefined";

  if (isBrowser && clientInstance) return clientInstance;
  if (!isBrowser && serverInstance) return serverInstance;

  const client = PublicClient.create({
    environment: mainnet,
    origin: isBrowser ? window.location.origin : "https://vr303.local",
  });

  if (isBrowser) {
    clientInstance = client;
  } else {
    serverInstance = client;
  }

  return client;
}
