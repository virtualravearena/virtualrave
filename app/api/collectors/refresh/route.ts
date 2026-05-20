import { NextResponse } from "next/server";
import { refreshFromChain } from "@/lib/collectors";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await refreshFromChain();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/collectors/refresh] failed:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
