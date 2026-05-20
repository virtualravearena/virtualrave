import { promises as fs } from "node:fs";
import path from "node:path";
import { createPublicClient, http, parseAbiItem, zeroAddress, type Address } from "viem";
import { lensServerChain, SERVER_CONTRACT } from "@/lib/lensChain";
import { VR303_DEPLOY_BLOCK } from "@/lib/vr303Constants";

export type CollectorAttribute = {
  trait_type: string;
  value: string;
};

export type CollectorMetadata = {
  dna: string;
  name: string;
  description: string;
  image: string;
  edition: number;
  date: number;
  attributes: CollectorAttribute[];
  compiler: string;
};

export type CollectorRecord = {
  tokenId: number;
  owner: Address;
  metadata?: CollectorMetadata;
};

export type CollectorsResponse = {
  collectors: CollectorRecord[];
  totalClaimed: number;
  fetchedAt: number | null;
};

const DATA_FILE = path.join(process.cwd(), "data", "collectors.json");
const TRAITS_FILE = path.join(process.cwd(), "data", "traits-metadata.json");
const LEGACY_METADATA_FILE = path.join(process.cwd(), "data", "collectors-metadata.json");
const MAX_SUPPLY = 303;

const OWNER_OF_ABI = [
  {
    name: "ownerOf",
    type: "function",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

const TOTAL_CLAIMED_ABI = [
  {
    name: "totalClaimed",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

function rpcUrl(): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (key) return `https://lens-mainnet.g.alchemy.com/v2/${key}`;
  return lensServerChain.rpcUrls.default.http[0];
}

function makeClient() {
  return createPublicClient({ chain: lensServerChain, transport: http(rpcUrl()) });
}

function parseJsonFile(raw: string): unknown {
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

async function readJson(): Promise<CollectorsResponse & { seeded: boolean }> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = parseJsonFile(raw) as Partial<CollectorsResponse> & { seeded?: boolean };
    return {
      collectors: parsed.collectors ?? [],
      totalClaimed: parsed.totalClaimed ?? 0,
      fetchedAt: parsed.fetchedAt ?? null,
      seeded: parsed.seeded ?? false,
    };
  } catch {
    return { collectors: [], totalClaimed: 0, fetchedAt: null, seeded: false };
  }
}

function isCollectorMetadata(item: unknown): item is CollectorMetadata {
  const candidate = item as Partial<CollectorMetadata> | null;
  return Boolean(
    candidate &&
      typeof candidate.edition === "number" &&
      typeof candidate.name === "string" &&
      typeof candidate.description === "string" &&
      typeof candidate.image === "string" &&
      typeof candidate.dna === "string" &&
      typeof candidate.date === "number" &&
      Array.isArray(candidate.attributes) &&
      typeof candidate.compiler === "string",
  );
}

function ingestMetadataPayload(parsed: unknown, metadataByEdition: Map<number, CollectorMetadata>) {
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (isCollectorMetadata(item)) metadataByEdition.set(item.edition, item);
    }
    return;
  }

  if (!parsed || typeof parsed !== "object") return;
  const tokens = (parsed as { tokens?: unknown }).tokens;
  if (!Array.isArray(tokens)) return;

  for (const token of tokens) {
    if (!token || typeof token !== "object") continue;
    const candidate = token as { tokenId?: unknown; metadata?: unknown };
    if (typeof candidate.tokenId !== "number") continue;
    if (!isCollectorMetadata(candidate.metadata)) continue;
    metadataByEdition.set(candidate.tokenId, candidate.metadata);
  }
}

async function readMetadataJson(): Promise<Map<number, CollectorMetadata>> {
  const metadataByEdition = new Map<number, CollectorMetadata>();
  for (const file of [TRAITS_FILE, LEGACY_METADATA_FILE]) {
    try {
      const raw = await fs.readFile(file, "utf-8");
      ingestMetadataPayload(parseJsonFile(raw), metadataByEdition);
    } catch {
      // ignore missing or malformed metadata files
    }
  }
  return metadataByEdition;
}

async function writeJson(state: CollectorsResponse & { seeded: boolean }) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
}

function enrichCollectors(
  collectors: CollectorRecord[],
  metadataByEdition: Map<number, CollectorMetadata>,
): CollectorRecord[] {
  return collectors.map((record) => ({
    ...record,
    metadata: metadataByEdition.get(record.tokenId + 1),
  }));
}

function normalizeCollectors(collectors: CollectorRecord[]): CollectorRecord[] {
  const byToken = new Map<number, CollectorRecord>();
  for (const record of collectors) {
    if (!Number.isInteger(record.tokenId) || record.tokenId < 0 || record.tokenId > MAX_SUPPLY) continue;
    byToken.set(record.tokenId, {
      tokenId: record.tokenId,
      owner: record.owner,
    });
  }
  return [...byToken.values()].sort((a, b) => a.tokenId - b.tokenId);
}

async function scanAllOwners(): Promise<CollectorRecord[]> {
  const client = makeClient();
  const ids = Array.from({ length: MAX_SUPPLY }, (_, i) => i + 1);
  const BATCH = 25;
  const collectors: CollectorRecord[] = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const slice = ids.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map(async (tokenId) => {
        try {
          const owner = await client.readContract({
            address: SERVER_CONTRACT,
            abi: OWNER_OF_ABI,
            functionName: "ownerOf",
            args: [BigInt(tokenId)],
          });
          return { tokenId, owner: owner as Address };
        } catch {
          return null;
        }
      }),
    );
    for (const r of results) if (r) collectors.push(r);
  }
  return collectors;
}

async function readTotalClaimed(client: ReturnType<typeof makeClient>) {
  const value = await client.readContract({
    address: SERVER_CONTRACT,
    abi: TOTAL_CLAIMED_ABI,
    functionName: "totalClaimed",
  });
  return Math.min(Number(value), MAX_SUPPLY);
}

async function readCollectorsFromTransferLogs(): Promise<CollectorRecord[]> {
  const client = makeClient();
  const logs = await client.getLogs({
    address: SERVER_CONTRACT,
    event: TRANSFER_EVENT,
    fromBlock: VR303_DEPLOY_BLOCK,
    toBlock: "latest",
  });

  const ownersByToken = new Map<number, Address>();
  for (const log of logs) {
    const tokenId = log.args.tokenId !== undefined ? Number(log.args.tokenId) : null;
    const to = log.args.to;
    if (tokenId === null || !to) continue;
    if (to.toLowerCase() === zeroAddress) {
      ownersByToken.delete(tokenId);
    } else {
      ownersByToken.set(tokenId, to as Address);
    }
  }

  return normalizeCollectors(
    [...ownersByToken.entries()].map(([tokenId, owner]) => ({ tokenId, owner })),
  );
}

async function rebuildAndPersist(): Promise<CollectorsResponse> {
  const collectors = await scanAllOwners();
  const state = {
    collectors: normalizeCollectors(collectors),
    totalClaimed: collectors.length,
    fetchedAt: Date.now(),
    seeded: true,
  };
  await writeJson(state);
  const metadataByEdition = await readMetadataJson();
  return {
    collectors: enrichCollectors(state.collectors, metadataByEdition),
    totalClaimed: state.totalClaimed,
    fetchedAt: state.fetchedAt,
  };
}

export async function readCollectors(): Promise<CollectorsResponse> {
  const state = await readJson();
  const metadataByEdition = await readMetadataJson();
  const collectors = normalizeCollectors(state.collectors);
  return {
    collectors: enrichCollectors(collectors, metadataByEdition),
    totalClaimed: state.totalClaimed || collectors.length,
    fetchedAt: state.fetchedAt,
  };
}

export async function refreshFromChain(): Promise<CollectorsResponse> {
  const normalized = await readCollectorsFromTransferLogs();
  const nextState = {
    collectors: normalized,
    totalClaimed: normalized.length,
    fetchedAt: Date.now(),
    seeded: true,
  };
  await writeJson(nextState);

  const metadataByEdition = await readMetadataJson();
  return {
    collectors: enrichCollectors(normalized, metadataByEdition),
    totalClaimed: normalized.length,
    fetchedAt: nextState.fetchedAt,
  };
}

// Back-compat aliases for existing callers.
export async function fetchMintLogs(): Promise<CollectorsResponse> {
  return readCollectors();
}
export async function appendMintFromReceipt(): Promise<CollectorsResponse> {
  return refreshFromChain();
}
