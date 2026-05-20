const DEFAULT_ORB_BUY_URL = "https://orbapi.xyz/buy";

export async function POST(request: Request) {
  const currentUrl = new URL(request.url);
  const upstream = process.env.ORB_BUY_ENDPOINT?.trim() || DEFAULT_ORB_BUY_URL;
  const origin = request.headers.get("origin") ?? currentUrl.origin;
  const referer = request.headers.get("referer") ?? origin;
  const body = await request.text();

  const response = await fetch(upstream, {
    method: "POST",
    headers: {
      "content-type": request.headers.get("content-type") ?? "application/json",
      origin,
      referer,
    },
    body,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "application/json";
  const responseBody = contentType.includes("application/json")
    ? JSON.stringify(await response.json().catch(() => null))
    : await response.text();

  return new Response(responseBody, {
    status: response.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  });
}
