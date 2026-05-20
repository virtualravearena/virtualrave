import {
  createPublicClient,
  http,
  parseAbiItem,
  type Address,
  type Hex,
  type Log,
} from "viem";
import { lensMainnet, CONTRACT } from "@/lib/wagmi";
import { VR303_DEPLOY_BLOCK } from "@/lib/vr303Constants";

export type CollectorRecord = {
  tokenId: number;
  owner: Address;
  txHash: Hex;
  blockNumber: number;
  blockTimestamp: number; // unix seconds
};

export type CollectorsResponse = {
  collectors: CollectorRecord[];
  totalClaimed: number;
  fetchedAt: number; // unix ms
};

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const serverClient = createPublicClient({
  chain: lensMainnet,
  transport: http(lensMainnet.rpcUrls.default.http[0]),
});

export async function fetchMintLogs(): Promise<CollectorsResponse> {
  const logs = await serverClient.getLogs({
    address: CONTRACT,
    event: TRANSFER_EVENT,
    args: { from: ZERO_ADDRESS },
    fromBlock: VR303_DEPLOY_BLOCK,
    toBlock: "latest",
  });

  // Group log indices by block so we fetch each block's timestamp once.
  const uniqueBlocks = new Set<bigint>();
  for (const log of logs) {
    if (log.blockNumber != null) uniqueBlocks.add(log.blockNumber);
  }

  const blockTimestamps = new Map<bigint, number>();
  const blockArray = Array.from(uniqueBlocks);
  // Parallel fetch — bounded by uniqueBlocks size, max 303.
  await Promise.all(
    blockArray.map(async (bn) => {
      const block = await serverClient.getBlock({ blockNumber: bn });
      blockTimestamps.set(bn, Number(block.timestamp));
    }),
  );

  const collectors: CollectorRecord[] = [];
  for (const log of logs) {
    const args = (log as Log & { args: { to?: Address; tokenId?: bigint } }).args;
    const to = args?.to;
    const tokenId = args?.tokenId;
    if (!to || tokenId === undefined) continue;
    if (log.blockNumber == null || log.transactionHash == null) continue;

    const idNumber = Number(tokenId);
    if (!Number.isInteger(idNumber) || idNumber < 1 || idNumber > 303) continue;

    const ts = blockTimestamps.get(log.blockNumber);
    if (ts === undefined) continue;

    collectors.push({
      tokenId: idNumber,
      owner: to,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      blockTimestamp: ts,
    });
  }

  // Dedup by tokenId (defensive — a token can only be minted once).
  const byId = new Map<number, CollectorRecord>();
  for (const c of collectors) {
    if (!byId.has(c.tokenId)) byId.set(c.tokenId, c);
  }
  const deduped = Array.from(byId.values()).sort((a, b) => a.tokenId - b.tokenId);

  return {
    collectors: deduped,
    totalClaimed: deduped.length,
    fetchedAt: Date.now(),
  };
}
