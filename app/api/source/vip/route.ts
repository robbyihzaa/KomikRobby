import { NextResponse } from "next/server";
import { komiku } from "../../../../lib/source";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "";
  const chapterNum = searchParams.get("chapter") || "";

  if (!slug || !chapterNum) {
    return NextResponse.json({ error: "Missing slug or chapter" }, { status: 400 });
  }

  try {
    const data = await komiku.chapter(slug, chapterNum);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Chapter unavailable" }, { status: 502 });
  }
}
