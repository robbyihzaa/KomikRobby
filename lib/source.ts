const BASE = "https://komikindo.ch";

const HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1"
};

interface CacheEntry {
  html: string;
  timestamp: number;
}

const htmlCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache for instant sub-second page loads

export async function fetchHtml(url: string) {
  const now = Date.now();
  const cached = htmlCache.get(url);
  
  // Return instant cached HTML if within 60-second TTL window
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.html;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const r = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
      next: { revalidate: 60 }
    });
    clearTimeout(timeoutId);

    if (!r.ok) {
      if (cached) return cached.html; // Return stale cache if target site returns error
      throw new Error(`Source returned ${r.status}`);
    }

    const text = await r.text();
    htmlCache.set(url, { html: text, timestamp: now });
    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    if (cached) return cached.html; // Return stale cache on network timeout/error
    throw err;
  }
}

/**
 * Parse comic cards from the site's HTML.
 * Handles the real `animepost` block structure:
 *   <div class="animepost">
 *     <a href="/komik/{slug}/" title="Komik ..."> <img src="..."> </a>
 *     <span class="typeflag Manhwa"></span>
 *     <div class="adds"> <div class="lsch"> <a>Ch. N</a> <span class="datech">13 jam lalu</span>
 */
export function parseCardsFromHtml(html: string) {
  // Match every outer animepost block (greedy-safe: stop at the next opening animepost)
  const blocks: string[] = [];
  const startTag = '<div class="animepost">';
  let pos = 0;
  while (pos < html.length) {
    const start = html.indexOf(startTag, pos);
    if (start === -1) break;
    // Find the next animepost start to delimit this block
    const next = html.indexOf(startTag, start + startTag.length);
    const blockHtml = next === -1 ? html.slice(start) : html.slice(start, next);
    blocks.push(blockHtml);
    pos = start + startTag.length;
  }

  const items: any[] = [];
  const seen = new Set<string>();

  for (const blockHtml of blocks) {
    // Slug + title from the cover <a>
    const linkMatch =
      blockHtml.match(/<a href="([^"]*\/komik\/([^"\/]+)\/?)"[^>]*title="([^"]+)"/i) ||
      blockHtml.match(/<a href="([^"]*\/komik\/([^"\/]+)\/?)"/i);

    // Cover image
    const imgMatch =
      blockHtml.match(/<img [^>]*src="(https?:[^"]+)"/i) ||
      blockHtml.match(/<img [^>]*data-lazy-src="(https?:[^"]+)"/i);

    if (!linkMatch || !imgMatch) continue;

    const slug = linkMatch[2];
    if (!slug || slug.includes("page") || seen.has(slug)) continue;
    seen.add(slug);

    let title = linkMatch[3]
      ? linkMatch[3].replace(/^Komik\s+/i, "").trim()
      : "";
    if (!title) {
      const h = blockHtml.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i);
      if (h) title = h[1].replace(/<[^>]+>/g, "").replace(/^Komik\s+/i, "").trim();
    }

    const image = imgMatch[1];

    // Type from <span class="typeflag Manhwa"> etc.
    const typeMatch =
      blockHtml.match(/class="typeflag\s+([^"\s]+)"/i) ||
      blockHtml.match(/class="type\s+([^"]+)"/i) ||
      blockHtml.match(/<span class="type">([\s\S]*?)<\/span>/i);
    let typeVal = typeMatch ? typeMatch[1].trim() : "Manhwa";
    if (typeVal.toLowerCase().includes("manhua")) typeVal = "Manhua";
    else if (typeVal.toLowerCase().includes("manga")) typeVal = "Manga";
    else typeVal = "Manhwa";

    // Latest chapter update date from <span class="datech">13 jam lalu</span>
    const datechMatch = blockHtml.match(/<span class="datech">([\s\S]*?)<\/span>/i);
    const updateDate = datechMatch ? datechMatch[1].replace(/<[^>]+>/g, "").trim() : "";

    // Latest chapter label from <a>Ch. N</a>
    const chMatch = blockHtml.match(/<div class="lsch">[\s\S]*?<a[^>]*>\s*(Ch\.\s*[\d.]+)\s*<\/a>/i);
    const latestChapter = chMatch ? chMatch[1].trim() : "";

    items.push({
      title: title || slug,
      slug,
      image,
      thumbnail: image,
      type: typeVal,
      updateDate,
      latestChapter,
      endpoint: `/detail-komik/${slug}`,
    });
  }

  return items;
}

export function parseManhwaDesuCards(html: string) {
  const items: any[] = [];
  const seen = new Set<string>();

  // 1. Try parsing <div class="utao"> (latest project updates with exact update time)
  const utaoMatches = [...html.matchAll(/<div class="utao">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi)];
  for (const m of utaoMatches) {
    const block = m[1];
    const linkMatch = block.match(/href="[^"]*\/komik\/([^"\/]+)\/?"[^>]*title="([^"]+)"/i) ||
                      block.match(/href="[^"]*\/komik\/([^"\/]+)\/?"/i);
    if (!linkMatch) continue;

    const slug = linkMatch[1];
    if (!slug || seen.has(slug)) continue;

    const title = linkMatch[2] ? linkMatch[2].replace(/^Komik\s+/i, "").trim() : slug;

    const imgMatch = block.match(/data-wpfc-original-src="([^"]+)"/i) ||
                     block.match(/data-src="([^"]+)"/i) ||
                     block.match(/data-lazy-src="([^"]+)"/i) ||
                     block.match(/src="(https?:[^"]+)"/i);
    let image = imgMatch ? imgMatch[1] : "";
    if (image.includes("data:image")) image = "";

    const chMatch = block.match(/<a [^>]*>\s*(Ch\.\s*[\d.]+)\s*<\/a>\s*<span>([\s\S]*?)<\/span>/i) ||
                    block.match(/<a [^>]*>\s*(Chapter\s*[\d.]+)\s*<\/a>\s*<span>([\s\S]*?)<\/span>/i);
    const latestChapter = chMatch ? chMatch[1].trim() : "";
    const updateDate = chMatch ? chMatch[2].replace(/<[^>]+>/g, "").trim() : "";

    const typeMatch = block.match(/class="(?:type|typeflag)\s+([^"\s]+)"/i) || block.match(/<ul class="([^"]+)">/i);
    const type = typeMatch ? typeMatch[1].trim() : "Manhwa";

    seen.add(slug);
    items.push({
      title,
      slug,
      image,
      thumbnail: image,
      type: type.toLowerCase().includes("manhua") ? "Manhua" : type.toLowerCase().includes("manga") ? "Manga" : "Manhwa",
      updateDate,
      latestChapter,
      endpoint: `/detail-komik/${slug}`,
      isVip: true,
      source: "manhwadesu",
    });
  }

  // 2. Parse <div class="bs"> (grid cards)
  const bsMatches = [...html.matchAll(/<div class="bs">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi)];
  for (const m of bsMatches) {
    const block = m[1];
    const linkMatch = block.match(/href="[^"]*\/komik\/([^"\/]+)\/?"[^>]*title="([^"]+)"/i) ||
                      block.match(/href="[^"]*\/komik\/([^"\/]+)\/?"/i);
    if (!linkMatch) continue;

    const slug = linkMatch[1];
    if (!slug || seen.has(slug)) continue;

    const title = linkMatch[2] ? linkMatch[2].replace(/^Komik\s+/i, "").trim() : slug;

    const imgMatch = block.match(/data-wpfc-original-src="([^"]+)"/i) ||
                     block.match(/data-src="([^"]+)"/i) ||
                     block.match(/data-lazy-src="([^"]+)"/i) ||
                     block.match(/src="(https?:[^"]+)"/i);
    let image = imgMatch ? imgMatch[1] : "";
    if (image.includes("data:image")) image = "";

    const chMatch = block.match(/class="epxs">([\s\S]*?)<\/div>/i);
    const latestChapter = chMatch ? chMatch[1].replace(/<[^>]+>/g, "").trim() : "";

    const typeMatch = block.match(/class="type\s+([^"\s]+)"/i);
    const type = typeMatch ? typeMatch[1].trim() : "Manhwa";

    seen.add(slug);
    items.push({
      title,
      slug,
      image,
      thumbnail: image,
      type: type.toLowerCase().includes("manhua") ? "Manhua" : type.toLowerCase().includes("manga") ? "Manga" : "Manhwa",
      updateDate: "",
      latestChapter: latestChapter ? (latestChapter.startsWith("Ch") ? latestChapter : `Ch. ${latestChapter.replace(/^Chapter\s*/i, "")}`) : "",
      endpoint: `/detail-komik/${slug}`,
      isVip: true,
      source: "manhwadesu",
    });
  }

  // 3. Fallback for generic comic <a> links
  if (items.length === 0) {
    const comicLinks = [...html.matchAll(/<a [^>]*href="([^"]*\/komik\/([^"\/]+)\/?)"[^>]*>([\s\S]*?)<\/a>/gi)];
    for (const m of comicLinks) {
      const slug = m[2];
      const inner = m[3];

      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      const imgMatch = inner.match(/data-wpfc-original-src="([^"]+)"/i) || inner.match(/src="([^"]+)"/i) || inner.match(/data-src="([^"]+)"/i);
      const titleMatch = inner.match(/title="([^"]+)"/i) || inner.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i);

      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/^Komik\s+/i, "").trim() : slug;
      let image = imgMatch ? imgMatch[1] : "";
      if (image.includes("data:image")) image = "";

      items.push({
        title,
        slug,
        image,
        thumbnail: image,
        type: "Manhwa",
        updateDate: "",
        latestChapter: "",
        endpoint: `/detail-komik/${slug}`,
        isVip: true,
        source: "manhwadesu",
      });
    }
  }

  return items;
}


/**
 * High-performance direct Manhwa / Comic Sub Indo Adapter.
 */
export const komiku = {
  /**
   * Latest comics sorted by update date (newest first).
   * Uses /komik-terbaru/ which is the site's official "recently updated" list.
   */
  latest: async (page = 1) => {
    const url = `${BASE}/komik-terbaru/page/${page}/`;
    const html = await fetchHtml(url);
    return parseCardsFromHtml(html);
  },

  /**
   * Popular comics sorted by all-time views.
   * Uses /manga/?orderby=popular which is the site's official popularity ranking.
   */
  popular: async (page = 1) => {
    const url = page === 1
      ? `${BASE}/manga/?orderby=popular`
      : `${BASE}/manga/page/${page}/?orderby=popular`;
    const html = await fetchHtml(url);
    return parseCardsFromHtml(html);
  },

  manhwadesu: async (page = 1) => {
    try {
      const url = page === 1 ? `https://manhwadesu.wiki/` : `https://manhwadesu.wiki/page/${page}/`;
      const html = await fetchHtml(url);
      const items = parseManhwaDesuCards(html);
      if (items.length > 0) return items;
      return parseCardsFromHtml(html);
    } catch (err) {
      // Fallback if Cloudflare blocks server fetch
      return komiku.filter({ type: "Manhwa", orderby: "update", page });
    }
  },



  filter: async (params: {
    genre?: string;
    type?: string;
    status?: string;
    orderby?: string;
    page?: number;
  } = {}) => {
    const qs = new URLSearchParams();

    // 1. Genre: in komikindo it is genre[]=slug
    if (params.genre) {
      qs.set("genre[]", params.genre.toLowerCase());
    }

    // 2. Type: Manga / Manhwa / Manhua (capitalized)
    if (params.type) {
      const t = params.type.toLowerCase();
      if (t.includes("manhua")) qs.set("type", "Manhua");
      else if (t.includes("manhwa")) qs.set("type", "Manhwa");
      else if (t.includes("manga")) qs.set("type", "Manga");
    }

    // 3. Status: Ongoing / Completed (capitalized)
    if (params.status) {
      const s = params.status.toLowerCase();
      if (s === "ongoing") qs.set("status", "Ongoing");
      else if (s === "completed" || s === "end") qs.set("status", "Completed");
    }

    // 4. Order: order=popular, update, latest, title, titlereverse
    if (params.orderby) {
      const o = params.orderby.toLowerCase();
      if (o === "popular") qs.set("order", "popular");
      else if (o === "update") qs.set("order", "update");
      else if (o === "titleasc" || o === "title") qs.set("order", "title");
      else if (o === "titlereverse") qs.set("order", "titlereverse");
      else qs.set("order", o);
    }

    const page = params.page && params.page > 0 ? params.page : 1;
    const base = page > 1 ? `${BASE}/daftar-manga/page/${page}/` : `${BASE}/daftar-manga/`;
    const queryString = qs.toString();
    const url = queryString ? `${base}?${queryString}` : base;
    const html = await fetchHtml(url);
    return parseCardsFromHtml(html);
  },

  library: async (page = 1) => komiku.latest(page),
  colored: async (page = 1) => komiku.latest(page),
  genres: async () => [],
  genre: async (slug: string, page = 1) => komiku.filter({ genre: slug, page }),

  search: async (q: string) => {
    if (!q) return [];
    const url = `${BASE}/?s=${encodeURIComponent(q)}`;
    const html = await fetchHtml(url);
    return parseCardsFromHtml(html);
  },

  detail: async (slug: string) => {
    const cleanSlug = decodeURIComponent(slug).replace(/^\/detail-komik\//, "").replace(/\/$/, "");
    let url = cleanSlug.startsWith("http") ? cleanSlug : `${BASE}/komik/${cleanSlug}/`;
    let html = "";

    try {
      html = await fetchHtml(url);
    } catch (err) {
      // Fallback to manhwadesu.wiki if main provider returns 404
      try {
        url = `https://manhwadesu.wiki/komik/${cleanSlug}/`;
        html = await fetchHtml(url);
      } catch (e2) {
        throw new Error(`Detail komik "${cleanSlug}" tidak ditemukan.`);
      }
    }

    const title = html.match(/<h1 class="entry-title"[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "")?.replace(/^Komik\s+/i, "")?.trim() || cleanSlug;
    const image = html.match(/<div class="thumb"[^>]*>[\s\S]*?<img [^>]*src="([^"]+)"/i)?.[1] || "";
    const desc = html.match(/<div class="entry-content entry-content-single"[^>]*>([\s\S]*?)<\/div>/i)?.[1]?.replace(/<[^>]+>/g, "")?.trim() || "Tidak ada deskripsi.";
    const type = html.match(/Type:<\/b>\s*<a[^>]*>(.*?)<\/a>/i)?.[1] || html.match(/Type:<\/b>\s*(.*?)</i)?.[1] || "Manhwa";
    const status = html.match(/Status:<\/b>\s*(.*?)</i)?.[1]?.trim() || "Ongoing";
    const author = html.match(/Author:<\/b>\s*(.*?)</i)?.[1]?.trim() || "-";
    const genre = [...html.matchAll(/rel="tag">(.*?)<\/a>/g)].map(m => m[1]);

    // Extract chapter list using scoped container parser
    const containerMatch =
      html.match(/id="chapter_list"[\s\S]*?<\/ul>/i) ||
      html.match(/id="chapterlist"[\s\S]*?<\/ul>/i) ||
      html.match(/class="clist"[\s\S]*?<\/ul>/i) ||
      html.match(/class="bxcl"[\s\S]*?<\/ul>/i) ||
      html.match(/class="eclist"[\s\S]*?<\/ul>/i) ||
      html.match(/<div [^>]*class="[^"]*lchx[^"]*"[\s\S]*?<\/div>/i);

    const chapterHtml = containerMatch ? containerMatch[0] : html;
    const liMatches = [...chapterHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    const chapters: any[] = [];
    const seen = new Set<string>();

    for (const m of liMatches) {
      const content = m[1];
      const aMatch = content.match(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!aMatch) continue;

      const chUrl = aMatch[1];

      // Exclude non-chapter URLs (downloads, social links, apps, bookmarks)
      if (
        chUrl.includes("safe.komik.one") ||
        chUrl.includes("pdf.gilakomik") ||
        chUrl.includes("bookmark") ||
        chUrl.includes("facebook") ||
        chUrl.includes("apk")
      ) {
        continue;
      }

      if (
        !/\/(?:[^\/]*-(?:chapter|ch)-\d+|chapter-\d+|ch-\d+|[^\/]*chapter[^\/]*)\/?$/i.test(chUrl) &&
        !chUrl.includes("-chapter-") &&
        !chUrl.includes("/chapter-")
      ) {
        continue;
      }

      if (seen.has(chUrl)) continue;
      seen.add(chUrl);

      const chapternumMatch = content.match(/class="chapternum">([\s\S]*?)<\/span>/i);
      const titleText = chapternumMatch
        ? chapternumMatch[1].replace(/<[^>]+>/g, "").trim()
        : aMatch[2].replace(/<[^>]+>/g, "").trim();

      const dtMatch = content.match(/<span class="(?:dt|chapterdate)">([\s\S]*?)<\/span>/i);
      const releaseDate = dtMatch ? dtMatch[1].replace(/<[^>]+>/g, "").trim() : "";

      const numMatch =
        chUrl.match(/chapter[^\d]*(\d+(?:\.\d+)?)/i) ||
        chUrl.match(/ch[^\d]*(\d+(?:\.\d+)?)/i) ||
        titleText.match(/chapter[^\d]*(\d+(?:\.\d+)?)/i) ||
        titleText.match(/ch[^\d]*(\d+(?:\.\d+)?)/i);

      const num = numMatch ? numMatch[1] : titleText.replace(/^[^\d]*/, "") || "1";

      chapters.push({
        title: titleText.startsWith("Chapter") ? titleText : `Chapter ${num}`,
        name: titleText.startsWith("Chapter") ? titleText : `Chapter ${num}`,
        chapter_number: num,
        number: num,
        endpoint: chUrl.split("/").filter(Boolean).pop() || num,
        url: chUrl,
        release_date: releaseDate,
        date: releaseDate
      });
    }

    return {
      title,
      image,
      thumbnail: image,
      description: desc,
      desc,
      type,
      status,
      author,
      genre,
      chapters,
      chapter_list: chapters
    };
  },

  chapter: async (slug: string, number: string) => {
    const cleanSlug = decodeURIComponent(slug).replace(/^\/detail-komik\//, "").replace(/\/$/, "");
    const cleanNumber = decodeURIComponent(number);

    let chUrl = "";
    try {
      const detailData = await komiku.detail(cleanSlug);
      const chRegex = new RegExp(`chapter-${cleanNumber}(\\D|$)`, "i");
      const matched = detailData.chapters.find(
        (c: any) =>
          c.number === cleanNumber ||
          c.endpoint === cleanNumber ||
          c.endpoint === `chapter-${cleanNumber}` ||
          chRegex.test(c.endpoint)
      );
      if (matched) chUrl = matched.url;
    } catch (e) {
      // Fallback
    }

    if (!chUrl) {
      chUrl = cleanNumber.includes("chapter") ? `${BASE}/${cleanNumber}/` : `${BASE}/${cleanSlug}-chapter-${cleanNumber}/`;
    }

    let html = "";
    try {
      html = await fetchHtml(chUrl);
    } catch (err) {
      if (!chUrl.endsWith("/")) chUrl += "/";
      try {
        html = await fetchHtml(chUrl);
      } catch (err2) {
        // Fallback to manhwadesu.wiki chapter if main server fails
        try {
          const mdChUrl = `https://manhwadesu.wiki/${cleanSlug}-chapter-${cleanNumber}/`;
          html = await fetchHtml(mdChUrl);
        } catch (err3) {
          throw new Error(`Chapter ${cleanNumber} tidak ditemukan.`);
        }
      }
    }

    let images: string[] = [];

    // 1. Try parsing JSON from ts_reader.run({ ... })
    const tsReaderMatch = html.match(/ts_reader\.run\s*\(\s*(\{[\s\S]*?\})\s*\)/i);
    if (tsReaderMatch) {
      try {
        const data = JSON.parse(tsReaderMatch[1]);
        if (data.sources && Array.isArray(data.sources)) {
          for (const s of data.sources) {
            if (s.images && Array.isArray(s.images) && s.images.length > 0) {
              images = s.images.map((img: string) => img.replace(/\\/g, ""));
              break;
            }
          }
        }
      } catch (e) {
        const imgMatches = tsReaderMatch[1].match(/https?:\\?\/\\?\/[^\s"',\\]+\.(?:webp|jpg|jpeg|png)/gi);
        if (imgMatches && imgMatches.length > 0) {
          images = imgMatches.map(u => u.replace(/\\/g, ""));
        }
      }
    }

    // 2. If no images found from ts_reader, search for images array in JS variables
    if (images.length === 0) {
      const jsImagesMatch = html.match(/(?:chapter_images|sources|images)\s*=\s*(\[[\s\S]*?\])/i);
      if (jsImagesMatch) {
        try {
          const parsed = JSON.parse(jsImagesMatch[1]);
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            images = parsed;
          }
        } catch (e) {}
      }
    }

    // 3. If still no images, parse HTML tags
    if (images.length === 0) {
      const imgTags = [...html.matchAll(/<img [^>]+>/gi)];
      for (const m of imgTags) {
        const tag = m[0];
        const srcMatch = tag.match(/(?:src|data-src|data-lazy-src|data-cfsrc)="([^"]+)"/i);
        if (srcMatch && srcMatch[1]) {
          images.push(srcMatch[1]);
        }
      }
    }

    // Specific gambling/ad keywords (avoid matching random numbers inside hashes)
    const adRegex = /slot|judi|gacor|scatter|spin|banner|iklan|pasang|linkalt|penta|kaiko|rusia|ratu|gaza|poker|togel|casino|maxwin|depo|jackpot|indo666|arab777|cina777|yandex|mc\.yandex|analytics/i;

    images = images.filter((src: string) => {
      const lower = src.toLowerCase();
      if (lower.endsWith(".gif")) return false; // Filter out animated GIF ads
      if (adRegex.test(lower)) return false;
      if (lower.includes("fav.png") || lower.includes("logo") || lower.includes("favicon") || lower.includes("komikindo-e") || lower.includes("avatar")) return false;
      return (
        lower.includes("/data/") ||
        lower.includes("/uploads/") ||
        lower.includes("gilakomik") ||
        lower.includes("komikcdn") ||
        lower.includes("manhwadesu") ||
        /\.(?:jpg|jpeg|webp|png)(?:\?|$)/i.test(lower)
      );
    });

    return {
      chapter: cleanNumber,
      images,
      image: images,
      pages: images
    };
  }
};


