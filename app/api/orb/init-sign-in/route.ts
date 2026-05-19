export async function GET(request: Request) {
  const url = new URL(request.url);
  const upstream = new URL("https://orbapi.xyz/init-sign-in");
  const origin = request.headers.get("origin") ?? url.origin;
  const referer = request.headers.get("referer") ?? origin;

  url.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value);
  });

  const response = await fetch(upstream.toString(), {
    method: "GET",
    headers: {
      origin,
      referer,
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "application/json";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return new Response(
    contentType.includes("application/json") ? JSON.stringify(body) : body,
    {
      status: response.status,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    },
  );
}
