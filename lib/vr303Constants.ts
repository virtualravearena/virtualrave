// VR 303 — non-secret constants shared by server and client.
// `VR303_DEPLOY_BLOCK` bounds the `eth_getLogs` scan for mint events.
// Owner to update once the real deploy block is known.

export const VR303_DEPLOY_BLOCK_DEFAULT = 1n;

const envDeploy = process.env.NEXT_PUBLIC_VR303_DEPLOY_BLOCK;

export const VR303_DEPLOY_BLOCK: bigint = (() => {
  if (envDeploy && /^\d+$/.test(envDeploy)) {
    return BigInt(envDeploy);
  }
  return VR303_DEPLOY_BLOCK_DEFAULT;
})();

export const VR303_DEPLOY_BLOCK_IS_DEFAULT =
  VR303_DEPLOY_BLOCK === VR303_DEPLOY_BLOCK_DEFAULT;

export const LENSCAN_BASE = "https://explorer.lens.xyz";

export function lenscanTxUrl(txHash: string): string {
  return `${LENSCAN_BASE}/tx/${txHash}`;
}

export function lenscanBlockUrl(blockNumber: number | bigint): string {
  return `${LENSCAN_BASE}/block/${blockNumber}`;
}

export function lenscanAddressUrl(address: string): string {
  return `${LENSCAN_BASE}/address/${address}`;
}

export function lenscanTokenUrl(contract: string, tokenId: number): string {
  return `${LENSCAN_BASE}/address/${contract}?tab=tokens&token=${tokenId}`;
}

export function truncateAddress(addr: string, head = 6, tail = 4): string {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function padTokenId(id: number, width = 3): string {
  return String(id).padStart(width, "0");
}
