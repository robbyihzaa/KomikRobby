import { NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "image2.komiku.to",
  "image3.komiku.to",
  "img.komiku.org",
  "thumbnail.komiku.org",
  "komiku.id",
  "komiku.org",
  "komikcdn.net",
  "komikcdn.me",
  "komikindo.ch",
  "komikindo.tv",
  "komikindo.org",
  "imageainewgeneration.lol",
  "i.imgur.com",
  "manhwadesu.org",
  "manhwadesu.wiki",
  "manhwadesu.me",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Security: allow known comic CDN hosts or image URLs
  const hostname = parsed.hostname.replace(/^www\./, "");
  const isAllowedHost = ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith("." + h));
  const isImageFile = /\.(?:jpg|jpeg|webp|png|gif|avif)(?:\?|$)/i.test(parsed.pathname);

  if (!isAllowedHost && !isImageFile) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://komiku.id/",
        Accept: "image/webp,image/avif,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
