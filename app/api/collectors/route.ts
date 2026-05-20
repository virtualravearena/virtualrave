import { NextResponse } from "next/server";
import { readCollectors } from "@/lib/collectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await readCollectors();
    return NextResponse.json(payload, {
      headers: {
        "x-vr303-cache": "file",
        "cache-control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[/api/collectors] failed:", err);
    return NextResponse.json(
      { error: message, stack, collectors: [], totalClaimed: 0, fetchedAt: null },
      { status: 503, headers: { "x-vr303-cache": "error" } },
    );
  }
}
