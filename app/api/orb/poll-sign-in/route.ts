export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin") ?? url.origin;
  const referer = request.headers.get("referer") ?? origin;

  const upstream = await fetch("https://orbapi.xyz/poll-sign-in", {
    method: "POST",
    headers: {
      "content-type": request.headers.get("content-type") ?? "application/json",
      origin,
      referer,
    },
    body: await request.text(),
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const body = contentType.includes("application/json")
    ? await upstream.json()
    : await upstream.text();

  return new Response(
    contentType.includes("application/json") ? JSON.stringify(body) : body,
    {
      status: upstream.status,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    },
  );
}
