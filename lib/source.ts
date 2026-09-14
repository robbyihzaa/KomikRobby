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
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes HTML cache

const resultCache = new Map<string, { data: any; timestamp: number }>();

function getCachedData(key: string, ttlMs: number) {
  const item = resultCache.get(key);
  if (item && Date.now() - item.timestamp < ttlMs) {
    return item.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  if (data && (!Array.isArray(data) || data.length > 0)) {
    resultCache.set(key, { data, timestamp: Date.now() });
  }
}

export async function fetchHtml(url: string) {
  const now = Date.now();
  const cached = htmlCache.get(url);
  
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.html;
  }

  // Build candidate URLs with relevant domain mirrors
  const candidateUrls: string[] = [url];
  if (url.startsWith(BASE)) {
    const path = url.slice(BASE.length);
    candidateUrls.push(`https://komikindo.tv${path}`);
    candidateUrls.push(`https://komikindo.org${path}`);
  } else if (url.startsWith("https://manhwadesu.org")) {
    const path = url.slice("https://manhwadesu.org".length);
    candidateUrls.push(`https://manhwadesu.wiki${path}`);
  }

  // Race candidates in parallel for sub-second fast response
  const fetchSingle = async (targetUrl: string) => {
    const r = await fetch(targetUrl, {
      headers: HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(3500), // 3.5s fast timeout per mirror
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    if (!text || text.length < 300) throw new Error("Empty response");
    return text;
  };

  try {
    const html = await Promise.any(candidateUrls.map((u) => fetchSingle(u)));
    htmlCache.set(url, { html, timestamp: now });
    return html;
  } catch {
    // Return stale cache if live requests failed
    if (cached && cached.html) {
      return cached.html;
    }
    throw new Error(`Gagal memuat sumber dari semua mirror.`);
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

/**
/**
 * Parse comic cards from komiku.id.
 * komiku.id is cloud-friendly (no Cloudflare Geo-IP block on serverless deployments).
 */
export function parseKomikuCards(html: string) {
  const items: any[] = [];
  const seen = new Set<string>();

  const articleRegex = /<(?:article|div)[^>]*class="[^"]*(?:ls4|ls2|bge|manga-card|kan|bge2)[^"]*"[\s\S]*?<\/(?:article|div)>/gi;
  const blocks = [...html.matchAll(articleRegex)];

  for (const m of blocks) {
    const block = m[0];

    const linkMatch = block.match(/href="(?:\/|https?:\/\/komiku\.id\/)?(?:manga|komik)\/([^"\/]+)\/?"/i);
    if (!linkMatch) continue;
    const slug = linkMatch[1];
    if (!slug || seen.has(slug) || slug === "page" || slug === "daftar-komik") continue;

    const titleMatch = block.match(/<h4[^>]*>[^<]*<a[^>]*>\s*([^<]+)/i)
      || block.match(/alt="([^"]+)"/i)
      || block.match(/title="([^"]+)"/i);
    const title = titleMatch ? titleMatch[1].replace(/^Baca\s+(Komik\s+)?/i, "").trim() : slug;

    const imgMatch = block.match(/data-src="([^"]+)"/i)
      || block.match(/src="(https?:\/\/[^"]+\.(?:jpg|webp|png)[^"]*)"/i);
    const image = imgMatch ? imgMatch[1] : "";

    const chMatch = block.match(/Chapter\s*([\d.]+)/i)
      || block.match(/Ch\.\s*([\d.]+)/i);
    const latestChapter = chMatch ? `Ch. ${chMatch[1]}` : "";

    let typeVal = "Manga";
    if (/manhwa/i.test(block) || /manhwa/i.test(slug)) typeVal = "Manhwa";
    else if (/manhua/i.test(block) || /manhua/i.test(slug)) typeVal = "Manhua";

    seen.add(slug);
    items.push({
      title,
      slug,
      image,
      thumbnail: image,
      type: typeVal,
      updateDate: "",
      latestChapter,
      endpoint: `/detail-komik/${slug}`,
      source: "komiku",
    });
  }

  // Direct anchor fallback
  if (items.length === 0) {
    const linkMatches = [...html.matchAll(/<a[^>]+href="(?:\/|https?:\/\/komiku\.id\/)?manga\/([^"\/]+)\/?"[^>]*>([\s\S]*?)<\/a>/gi)];
    for (const m of linkMatches) {
      const slug = m[1];
      if (!slug || seen.has(slug) || slug === "page" || slug === "daftar-komik") continue;

      const imgMatch = m[0].match(/data-src="([^"]+)"/i) || m[0].match(/src="([^"]+)"/i);
      const titleMatch = m[0].match(/alt="([^"]+)"/i) || m[2].replace(/<[^>]+>/g, '').trim();
      const title = typeof titleMatch === "string" ? titleMatch.replace(/^Baca\s+(Komik\s+)?/i, "").trim() : slug;

      if (title && title.length > 1) {
        seen.add(slug);
        items.push({
          title,
          slug,
          image: imgMatch ? imgMatch[1] : "",
          thumbnail: imgMatch ? imgMatch[1] : "",
          type: /manhwa/i.test(slug) ? "Manhwa" : "Manga",
          updateDate: "",
          latestChapter: "",
          endpoint: `/detail-komik/${slug}`,
          source: "komiku",
        });
      }
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
  /**
   * Latest comics sorted by update date (newest first).
   * Uses /komik-terbaru/ which is the site's official "recently updated" list.
   */
  latest: async (page = 1) => {
    const cacheKey = `latest:${page}`;
    const cached = getCachedData(cacheKey, 3 * 60 * 1000);
    if (cached) return cached;

    // Stage 1: komikindo.ch (primary)
    try {
      const url = `${BASE}/komik-terbaru/page/${page}/`;
      const html = await fetchHtml(url);
      const items = parseCardsFromHtml(html);
      if (items.length > 0) {
        setCachedData(cacheKey, items);
        return items;
      }
    } catch (e) {
      console.error("komiku.latest primary failed:", e);
    }
    // Stage 2: api.komiku.org (cloud-friendly fallback, no Cloudflare block)
    try {
      const url = page === 1
        ? `https://api.komiku.org/?post_type=manga&orderby=date`
        : `https://api.komiku.org/page/${page}/?post_type=manga&orderby=date`;
      const html = await fetchHtml(url);
      const items = parseKomikuCards(html);
      if (items.length > 0) {
        setCachedData(cacheKey, items);
        return items;
      }
    } catch (e) {}
    return [];
  },

  /**
   * Popular comics sorted by all-time views (prioritizing popular Manhwa).
   */
  popular: async (page = 1) => {
    const cacheKey = `popular:${page}`;
    const cached = getCachedData(cacheKey, 5 * 60 * 1000);
    if (cached) return cached;

    // Stage 1: komikindo.ch popular Manhwa (primary)
    try {
      const url = page === 1
        ? `${BASE}/daftar-manga/?type=Manhwa&order=popular`
        : `${BASE}/daftar-manga/page/${page}/?type=Manhwa&order=popular`;
      const html = await fetchHtml(url);
      const items = parseCardsFromHtml(html);
      if (items.length > 0) {
        setCachedData(cacheKey, items);
        return items;
      }
    } catch (e) {
      console.error("komiku.popular primary failed:", e);
    }
    // Stage 2: komikindo.ch general popular fallback
    try {
      const url = page === 1
        ? `${BASE}/manga/?orderby=popular`
        : `${BASE}/manga/page/${page}/?orderby=popular`;
      const html = await fetchHtml(url);
      const items = parseCardsFromHtml(html);
      if (items.length > 0) {
        setCachedData(cacheKey, items);
        return items;
      }
    } catch (e) {}
    // Stage 3: api.komiku.org popular Manhwa (cloud-friendly fallback)
    try {
      const html = await fetchHtml(`https://api.komiku.org/?post_type=manga&tipe=manhwa`);
      const items = parseKomikuCards(html);
      if (items.length > 0) {
        setCachedData(cacheKey, items);
        return items;
      }
    } catch (e) {}
    // Stage 4: api.komiku.org general popular fallback
    try {
      const html = await fetchHtml(`https://api.komiku.org/?post_type=manga&orderby=meta_value_num`);
      const items = parseKomikuCards(html);
      if (items.length > 0) {
        setCachedData(cacheKey, items);
        return items;
      }
    } catch (e) {}
    return [];
  },

  filter: async (params: {
    genre?: string;
    type?: string;
    status?: string;
    orderby?: string;
    page?: number;
  } = {}) => {
    // Stage 1: komikindo.ch primary
    try {
      const qs = new URLSearchParams();

      if (params.genre) {
        qs.set("genre[]", params.genre.toLowerCase());
      }

      if (params.type) {
        const t = params.type.toLowerCase();
        if (t.includes("manhua")) qs.set("type", "Manhua");
        else if (t.includes("manhwa")) qs.set("type", "Manhwa");
        else if (t.includes("manga")) qs.set("type", "Manga");
      }

      if (params.status) {
        const s = params.status.toLowerCase();
        if (s === "ongoing") qs.set("status", "Ongoing");
        else if (s === "completed" || s === "end") qs.set("status", "Completed");
      }

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
      const items = parseCardsFromHtml(html);
      if (items.length > 0) return items;
    } catch (err) {
      console.error("komiku.filter primary error:", err);
    }

    // Stage 2: api.komiku.org fallback (100% cloud-friendly, no Cloudflare block)
    try {
      const qs2 = new URLSearchParams();
      qs2.set("post_type", "manga");
      if (params.type) qs2.set("tipe", params.type.toLowerCase());
      if (params.orderby === "popular" || !params.orderby) qs2.set("orderby", "meta_value_num");
      else if (params.orderby === "update") qs2.set("orderby", "date");
      if (params.status) qs2.set("status", params.status);
      if (params.genre) qs2.set("genre", params.genre.toLowerCase());
      if (params.page && params.page > 1) qs2.set("page", params.page.toString());

      const url2 = `https://api.komiku.org/?${qs2.toString()}`;
      const html2 = await fetchHtml(url2);
      const items2 = parseKomikuCards(html2);
      if (items2.length > 0) return items2;
    } catch (err2) {
      console.error("komiku.filter fallback error:", err2);
    }

    return [];
  },

  library: async (page = 1) => komiku.latest(page),
  colored: async (page = 1) => komiku.latest(page),
  genres: async () => [],
  genre: async (slug: string, page = 1) => komiku.filter({ genre: slug, page }),

  search: async (q: string) => {
    if (!q) return [];
    // Stage 1: komikindo.ch primary
    try {
      const url = `${BASE}/?s=${encodeURIComponent(q)}`;
      const html = await fetchHtml(url);
      const items = parseCardsFromHtml(html);
      if (items.length > 0) return items;
    } catch (err) {
      console.error("komiku.search primary error:", err);
    }
    // Stage 2: api.komiku.org fallback (100% cloud-friendly, no Cloudflare block)
    try {
      const url2 = `https://api.komiku.org/?post_type=manga&s=${encodeURIComponent(q)}`;
      const html2 = await fetchHtml(url2);
      const items2 = parseKomikuCards(html2);
      if (items2.length > 0) return items2;
    } catch (err2) {
      console.error("komiku.search fallback error:", err2);
    }
    return [];
  },

  detail: async (slug: string) => {
    const cleanSlug = decodeURIComponent(slug).replace(/^\/detail-komik\//, "").replace(/\/$/, "");
    const cacheKey = `detail:${cleanSlug}`;
    const cached = getCachedData(cacheKey, 10 * 60 * 1000);
    if (cached) return cached;

    let html = "";

    // Stage 1: Primary provider (komikindo.ch)
    try {
      html = await fetchHtml(`${BASE}/komik/${cleanSlug}/`);
    } catch (err) {
      console.error("komiku.detail komikindo.ch failed, trying komiku.id:", err);
    }

    // Stage 2: Cloud-friendly fallback (komiku.id)
    if (!html) {
      try {
        const text = await fetchHtml(`https://komiku.id/manga/${cleanSlug}/`);
        if (text && text.length > 5000 && !text.includes("404")) {
          html = text;
        }
      } catch (err2) {
        console.error("komiku.detail komiku.id direct slug failed:", err2);
      }
    }

    // Stage 3: Auto-slug search fallback (find real slug on komiku.id if slug differs)
    if (!html) {
      try {
        const query = cleanSlug.replace(/-/g, " ");
        const searchHtml = await fetchHtml(`https://api.komiku.org/?post_type=manga&s=${encodeURIComponent(query)}`);
        const cards = parseKomikuCards(searchHtml);
        if (cards.length > 0 && cards[0].slug) {
          const actualSlug = cards[0].slug;
          html = await fetchHtml(`https://komiku.id/manga/${actualSlug}/`);
        }
      } catch (err3) {
        console.error("komiku.detail auto-slug search fallback failed:", err3);
      }
    }

    // Stage 3: Throw clean error if all providers fail
    if (!html) {
      throw new Error(`Detail komik "${cleanSlug}" tidak dapat dimuat.`);
    }

    const title =
      html.match(/<h1 class="entry-title"[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "")?.replace(/^Komik\s+/i, "")?.trim() ||
      html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "")?.replace(/^Komik\s+/i, "")?.trim() ||
      cleanSlug;

    const image =
      html.match(/<div class="thumb"[^>]*>[\s\S]*?<img [^>]*src="([^"]+)"/i)?.[1] ||
      html.match(/class="ims"[\s\S]*?<img [^>]*src="([^"]+)"/i)?.[1] ||
      html.match(/data-src="(https?:\/\/[^"]+)"/i)?.[1] ||
      "";

    const desc =
      html.match(/<div class="entry-content entry-content-single"[^>]*>([\s\S]*?)<\/div>/i)?.[1]?.replace(/<[^>]+>/g, "")?.trim() ||
      html.match(/<p class="desc"[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]+>/g, "")?.trim() ||
      "Tidak ada deskripsi.";

    const type =
      html.match(/Type:<\/b>\s*<a[^>]*>(.*?)<\/a>/i)?.[1] ||
      html.match(/Jenis Komik:<\/b>\s*(.*?)</i)?.[1] ||
      "Manhwa";

    const status = html.match(/Status:<\/b>\s*(.*?)</i)?.[1]?.trim() || "Ongoing";
    const author =
      html.match(/Author:<\/b>\s*(.*?)</i)?.[1]?.trim() ||
      html.match(/Penulis:<\/b>\s*(.*?)</i)?.[1]?.trim() ||
      "-";

    const genre = [...html.matchAll(/rel="tag">(.*?)<\/a>/g)].map(m => m[1]);

    const chapters: any[] = [];
    const seen = new Set<string>();

    // Pattern A: standard chapterlist container (komikindo & manhwadesu)
    const containerMatch =
      html.match(/id="chapter_list"[\s\S]*?<\/ul>/i) ||
      html.match(/id="chapterlist"[\s\S]*?<\/ul>/i) ||
      html.match(/class="clist"[\s\S]*?<\/ul>/i) ||
      html.match(/class="bxcl"[\s\S]*?<\/ul>/i) ||
      html.match(/class="eclist"[\s\S]*?<\/ul>/i);

    if (containerMatch) {
      const liMatches = [...containerMatch[0].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
      for (const m of liMatches) {
        const content = m[1];
        const aMatch = content.match(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!aMatch) continue;

        const chUrl = aMatch[1];
        if (chUrl.includes("bookmark") || chUrl.includes("facebook") || chUrl.includes("apk")) continue;
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
          titleText.match(/(\d+(?:\.\d+)?)/);

        const num = numMatch ? numMatch[1] : titleText.replace(/^[^\d]*/, "") || "1";
        const endpoint = chUrl.replace(/^https?:\/\/[^\/]+/, "").replace(/^\//, "").replace(/\/$/, "");

        chapters.push({
          title: titleText.startsWith("Chapter") ? titleText : `Chapter ${num}`,
          name: titleText.startsWith("Chapter") ? titleText : `Chapter ${num}`,
          chapter_number: num,
          number: num,
          endpoint: endpoint || num,
          url: chUrl,
          release_date: releaseDate,
          date: releaseDate,
        });
      }
    }

    // Pattern B: komiku.id table format (<td class="judulseries">)
    if (chapters.length === 0) {
      const tdMatches = [...html.matchAll(/<td class="judulseries">[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
      for (const m of tdMatches) {
        const chUrl = m[1];
        if (seen.has(chUrl)) continue;
        seen.add(chUrl);

        const titleText = m[2].replace(/<[^>]+>/g, "").trim();
        const numMatch = chUrl.match(/chapter-(\d+(?:\.\d+)?)/i) || titleText.match(/(\d+(?:\.\d+)?)/);
        const num = numMatch ? numMatch[1] : "1";
        const fullUrl = chUrl.startsWith("http") ? chUrl : `https://komiku.id${chUrl}`;
        const endpoint = chUrl.replace(/^\//, "").replace(/\/$/, "");

        chapters.push({
          title: titleText.startsWith("Chapter") ? titleText : `Chapter ${num}`,
          name: titleText.startsWith("Chapter") ? titleText : `Chapter ${num}`,
          chapter_number: num,
          number: num,
          endpoint: endpoint || num,
          url: fullUrl,
          release_date: "",
          date: "",
        });
      }
    }

    const detailResult = {
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
      chapter_list: chapters,
    };
    setCachedData(cacheKey, detailResult);
    return detailResult;
  },

  chapter: async (slug: string, number: string) => {
    const cleanSlug = decodeURIComponent(slug).replace(/^\/detail-komik\//, "").replace(/\/$/, "");
    const cleanNumber = decodeURIComponent(number);
    const cacheKey = `chapter:${cleanSlug}:${cleanNumber}`;
    const cached = getCachedData(cacheKey, 15 * 60 * 1000);
    if (cached) return cached;

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
        // Fallback 1: komiku.id chapter
        try {
          const komikuChUrl = cleanNumber.includes("chapter")
            ? `https://komiku.id/${cleanNumber}/`
            : `https://komiku.id/${cleanSlug}-chapter-${cleanNumber}/`;
          html = await fetchHtml(komikuChUrl);
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

    const chapterResult = {
      chapter: cleanNumber,
      images,
      image: images,
      pages: images
    };
    if (images.length > 0) setCachedData(cacheKey, chapterResult);
    return chapterResult;
  }
};


