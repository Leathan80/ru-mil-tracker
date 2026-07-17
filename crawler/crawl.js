// RSS/Atom-crawler voor de RU Military Tracker (ru-mil-tracker.web.app).
// Zelfde patroon als de Intel Briefing-crawlers: worker pool, retries, carry-over.
// Leest crawler/sources.json, schrijft public/feed.json (platte itemlijst met
// stream-veld: 'verified' of 'single'). Bronnen die falen behouden hun items
// van de vorige run; de run faalt alleen hard als ALLE bronnen falen én er
// geen vorige feed is. Geen npm-dependencies (fetch + crypto zijn builtins).

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const FEED_PATH = path.join(PUBLIC_DIR, "feed.json");
const CONCURRENCY = 6;
const RETRIES = 2;
const FETCH_TIMEOUT_MS = 12000;
const WINDOW_DAYS = { verified: 14, single: 30 }; // maandbladen krijgen een ruimer venster
const MAX_PER_SOURCE = 40;
const MAX_TOTAL = 400;
const SUMMARY_MAX = 400;

// Relevantie-gate voor brede bronnen (relevance: "filter"): alleen items die
// aan Rusland/Oekraïne-militair raken komen door.
const RU_RE = /\b(russia[n]?s?|russisch|moscow|kremlin|putin|ukrain\w*|shahed|geran-?\d*|lancet|iskander|kinzhal|kalibr|glide bomb|FAB-\d+|UMPK|wagner|vdv\b|spetsnaz|donbas|donetsk|luhansk|kharkiv|zaporizh\w*|kherson|crimea|black sea fleet|belgorod|kursk|mobili[sz]ation|rosgvardia|gerasimov|shoigu|belousov)\b/i;

const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, "sources.json"), "utf8"));
const SOURCES = CFG.sources.filter(s => s.enabled);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">"));
  return m ? m[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim() : "";
}

function stripHtml(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

// URL normaliseren voor dedup: tracking-params en trailing slash eraf, host lowercase.
function normalizeUrl(u) {
  try {
    const url = new URL(u);
    url.hash = "";
    const drop = [];
    url.searchParams.forEach((_, k) => { if (/^(utm_|fbclid|gclid|mc_cid|mc_eid|ref$)/i.test(k)) drop.push(k); });
    drop.forEach(k => url.searchParams.delete(k));
    url.hostname = url.hostname.toLowerCase();
    let s = url.toString();
    if (s.endsWith("/")) s = s.slice(0, -1);
    return s;
  } catch { return u; }
}

const sha12 = s => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
const titleKey = t => sha12(t.toLowerCase().replace(/[^a-z0-9Ѐ-ӿ]+/g, ""));

// Eén item-blok (RSS <item> of Atom <entry>) → item-object of null.
function parseBlock(block, isAtom) {
  let title = stripHtml(tag(block, "title"));
  let link = "";
  if (isAtom) {
    const alt = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/) ||
                block.match(/<link[^>]*href=["']([^"']+)["']/);
    link = alt ? decodeEntities(alt[1]) : "";
  } else {
    link = decodeEntities(tag(block, "link"));
    if (!link) { // sommige feeds: <link href="..."/>
      const m = block.match(/<link[^>]*href=["']([^"']+)["']/);
      link = m ? decodeEntities(m[1]) : "";
    }
  }
  const gnewsSource = decodeEntities(tag(block, "source"));
  if (gnewsSource && title.endsWith(" - " + gnewsSource)) title = title.slice(0, -(gnewsSource.length + 3));
  const pub = tag(block, "pubDate") || tag(block, "published") || tag(block, "updated") || tag(block, "dc:date");
  const d = pub ? new Date(pub) : null;
  const rawSummary = tag(block, "description") || tag(block, "summary") || tag(block, "content:encoded") || tag(block, "content");
  if (!title || !link) return null;
  return {
    title,
    url: normalizeUrl(link),
    date: d && !isNaN(d) ? d.toISOString() : null,
    summaryRaw: stripHtml(rawSummary).slice(0, SUMMARY_MAX),
  };
}

function parseFeed(xml) {
  let blocks = [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)].map(m => m[1]);
  let isAtom = false;
  if (!blocks.length) {
    blocks = [...xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/g)].map(m => m[1]);
    isAtom = true;
  }
  return blocks.map(b => parseBlock(b, isAtom)).filter(Boolean);
}

async function fetchSource(src) {
  for (let attempt = 1; ; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(src.feedUrl, {
        headers: {
          "User-Agent": src.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ru-mil-tracker/1.0",
          "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        },
        signal: ctrl.signal,
        redirect: "follow",
      });
      if (!res.ok) {
        if (attempt <= RETRIES) { await sleep(1500 * attempt); continue; }
        throw new Error("HTTP " + res.status);
      }
      const xml = await res.text();
      const parsed = parseFeed(xml);
      // Lege maar geldige feed (bijv. Google News-query zonder resultaten) is geen fout.
      if (!parsed.length && !/<(rss|feed)[\s>]/.test(xml)) throw new Error("geen items geparsed (geen RSS/Atom?)");

      const relevant = src.relevance === "filter"
        ? parsed.filter(it => RU_RE.test(it.title + " " + it.summaryRaw))
        : parsed;

      return relevant.slice(0, src.maxNew || 8).map(it => ({
        id: sha12(it.url),
        title: it.title,
        url: it.url,
        source: src.id,
        sourceName: src.name,
        state: !!src.state,
        stream: src.stream,
        origin: src.origin || null,
        date: it.date,
        summaryRaw: it.summaryRaw,
      }));
    } catch (e) {
      if (attempt <= RETRIES && e.name === "AbortError") { await sleep(1500); continue; }
      throw (e.name === "AbortError" ? new Error("timeout") : e);
    } finally {
      clearTimeout(timer);
    }
  }
}

async function main() {
  let prev = { items: [], sources: {} };
  try { prev = JSON.parse(fs.readFileSync(FEED_PATH, "utf8")); } catch {}
  const prevItems = Array.isArray(prev.items) ? prev.items : [];

  const now = Date.now();
  const sourcesOut = {};
  let ok = 0, failed = 0, carried = 0;
  const fresh = [];

  const queue = SOURCES.slice();
  async function worker() {
    let src;
    while ((src = queue.shift()) !== undefined) {
      try {
        const items = await fetchSource(src);
        fresh.push(...items);
        sourcesOut[src.id] = { name: src.name, stream: src.stream, status: "ok", lastSuccess: new Date().toISOString() };
        ok++;
        console.log(`  ok    ${src.id}: ${items.length} items`);
      } catch (e) {
        failed++;
        const prevInfo = (prev.sources || {})[src.id];
        sourcesOut[src.id] = { name: src.name, stream: src.stream, status: "carried", lastSuccess: prevInfo?.lastSuccess || null };
        if (prevItems.some(it => it.source === src.id)) carried++;
        console.error(`  FOUT  ${src.id}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (ok === 0 && prevItems.length === 0) {
    console.error("Alle bronnen faalden en er is geen vorige feed — feed.json niet geschreven");
    process.exit(1);
  }
  if (ok === 0) {
    console.error("Alle bronnen faalden — vorige feed.json blijft ongewijzigd staan");
    return;
  }

  // Merge: vers + carry-over (vorige items), dedup op url-id en titel-hash.
  const byId = new Map();
  const byTitle = new Set();
  const merged = [];
  for (const it of [...fresh, ...prevItems]) {
    if (!it || !it.id || byId.has(it.id)) continue;
    const tk = titleKey(it.title || "");
    if (byTitle.has(tk)) continue;
    byId.set(it.id, true);
    byTitle.add(tk);
    merged.push(it);
  }

  // Venster per stream + caps.
  const windowed = merged.filter(it => {
    const days = WINDOW_DAYS[it.stream] || 14;
    const t = it.date ? Date.parse(it.date) : now;
    return now - t <= days * 86400000;
  });
  windowed.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const perSource = {};
  const items = [];
  for (const it of windowed) {
    perSource[it.source] = (perSource[it.source] || 0) + 1;
    if (perSource[it.source] > MAX_PER_SOURCE) continue;
    items.push(it);
    if (items.length >= MAX_TOTAL) break;
  }

  const feed = {
    updated: new Date().toISOString(),
    stats: { ok, carried, failed, items: items.length },
    sources: sourcesOut,
    items,
  };
  fs.writeFileSync(FEED_PATH, JSON.stringify(feed, null, 1));
  console.log(`feed.json: ${items.length} items — ${ok} bronnen vers, ${carried} carry-over, ${failed} fouten`);
}

main().catch(e => { console.error(e); process.exit(1); });
