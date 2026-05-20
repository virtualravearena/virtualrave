import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchMintLogs, type CollectorsResponse } from "@/lib/collectors";

export const runtime = "nodejs";

const CACHE_KEY: string[] = ["vr303-collectors"];
const CACHE_TAGS: string[] = ["vr303-collectors"];
const CACHE_REVALIDATE_SECONDS = 60;

const getCachedCollectors = unstable_cache(
  async (): Promise<CollectorsResponse> => fetchMintLogs(),
  CACHE_KEY,
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: CACHE_TAGS },
);

let lastFreshAt = 0;
const FRESH_MIN_INTERVAL_MS = 5_000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wantsFresh = url.searchParams.get("fresh") === "1";
  const now = Date.now();
  const rateLimited = wantsFresh && now - lastFreshAt < FRESH_MIN_INTERVAL_MS;

  try {
    let payload: CollectorsResponse;
    let cacheHeader = "hit";

    if (wantsFresh && !rateLimited) {
      payload = await fetchMintLogs();
      lastFreshAt = Date.now();
      cacheHeader = "fresh";
    } else {
      payload = await getCachedCollectors();
      if (wantsFresh && rateLimited) cacheHeader = "rate-limited";
    }

    return NextResponse.json(payload, {
      headers: {
        "x-vr303-cache": cacheHeader,
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message, collectors: [], totalClaimed: 0, fetchedAt: null },
      { status: 503, headers: { "x-vr303-cache": "error" } },
    );
  }
}
