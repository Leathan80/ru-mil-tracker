// Cross-check van tracker-bevindingen naar de threat sheets van de zustersites.
// Leest public/analysis.json + crawler/cardmap.json en bepaalt per kaart-id
// (drone-academy, AirDefense/VKS, EW Academy) welke gecureerde entries relevant
// zijn. Schrijft public/crosscheck.json, dat twee consumenten dient:
//
//   1. De live "recente ontwikkelingen"-blokken op de zustersites (fetchen dit
//      bestand cross-origin en filteren op hun eigen kaart-id).
//   2. De dagelijkse analysetaak, die de `signals` gebruikt om te beoordelen of
//      een gecureerde kaartwaarde verouderd is.
//
// GEEN automatische wijziging van kaartwaarden — zelfde afspraak als
// threat-review.js bij het intel-dashboard: dit is een cureer-hulpmiddel, de
// mens beslist. De kaartwaarden zelf staan in de repo's van de zustersites
// (drone-academy/js/data-cards.js, VKS-leeromgeving/js/data-threats.js).

const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const MAX_PER_CARD = 6;        // nieuwste N entries per kaart (houdt de feed klein)
const WINDOW_DAYS = 60;        // entries ouder dan dit niet meer meesturen
const SUMMARY_CHARS = 320;     // eerste alinea, afgekapt

// Signalen die kunnen wijzen op een verouderde kaartwaarde. Zelfde categorieën
// als threat-review.js, uitgebreid met NL-termen omdat onze samenvattingen
// tweetalig zijn.
const SIGNALS = [
  { key: "loss", label: "Verlies / uitgeschakeld", re: /\b(destroyed|shot down|downed|struck|damaged|neutrali[sz]ed|wreck(?:ed|age)|losses?|vernietigd|neergehaald|uitgeschakeld|beschadigd)\b/i },
  { key: "variant", label: "Nieuwe variant / upgrade", re: /\b(new variant|upgraded|modernized|modernised|new version|next.gen|prototype|unveiled|reveal(?:ed|s)?|nieuwe variant|gemoderniseerd|nieuwe versie|onthuld)\b/i },
  { key: "deploy", label: "Ontplooiing / levering", re: /\b(deploy(?:ed|ment|s)?|delivered|delivery|entered service|operational|fielded|transferred|ontplooi|geleverd|in dienst|operationeel|ingezet)\b/i },
  { key: "perf", label: "Prestatie / bereik", re: /\b(range of|km range|extended range|longer range|payload|warhead|speed of|higher altitude|bereik van|laadvermogen|snelheid van|hoogte)\b/i },
  { key: "scale", label: "Schaal / productie", re: /\b(per month|per week|monthly|production rate|output|scaled up|ramp(?:ed|ing) up|launches|per maand|per week|productie|opgeschaald|lanceringen)\b/i },
  { key: "counter", label: "Tegenmaatregel / adaptatie", re: /\b(counter(?:measure|ed|ing)?|adapt(?:ed|ation|ing)|resistant|hardened|evade|circumvent|tegenmaatregel|aanpassing|resistent|omzeil)\b/i },
];

function firstParagraph(text) {
  const p = String(text || "").split(/\n\n+/)[0].trim();
  return p.length > SUMMARY_CHARS ? p.slice(0, SUMMARY_CHARS - 1).trimEnd() + "…" : p;
}

function classify(text) {
  return SIGNALS.filter(s => s.re.test(text)).map(s => s.key);
}

function main() {
  let analysis, cardmap;
  try {
    analysis = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, "analysis.json"), "utf8"));
  } catch {
    console.error("Geen analysis.json — cross-check overgeslagen");
    return;
  }
  try {
    cardmap = JSON.parse(fs.readFileSync(path.join(__dirname, "cardmap.json"), "utf8"));
  } catch (e) {
    console.error("cardmap.json onleesbaar: " + e.message);
    process.exit(1);
  }

  const cutoff = Date.now() - WINDOW_DAYS * 86400000;
  const entries = (analysis.entries || []).filter(e => {
    const t = Date.parse(e.publishedAt || e.updatedAt || "");
    return isNaN(t) ? true : t >= cutoff;
  });

  const outSites = {};
  let totalMatches = 0;
  let cardsWithHits = 0;

  for (const siteId of Object.keys(cardmap.sites || {})) {
    const site = cardmap.sites[siteId];
    const outCards = {};

    for (const cardId of Object.keys(site.cards || {})) {
      const card = site.cards[cardId];
      const re = new RegExp(card.match, "i");
      // `require`: tweede regex die óók moet matchen. Nodig bij systeemnamen die
      // samenvallen met plaatsnamen (Voronezh, Murmansk, Borisoglebsk) — anders
      // matcht elk bericht over die stad of oblast op de radarkaart.
      const requireRe = card.require ? new RegExp(card.require, "i") : null;
      const topicGate = card.topics && card.topics.length ? new Set(card.topics) : null;

      const matched = [];
      for (const e of entries) {
        // Topic-gate: bij generieke termen alleen entries binnen het juiste
        // onderwerpgebied meenemen, anders schiet de regex te breed.
        if (topicGate) {
          const inScope = (e.topics || []).some(t => topicGate.has(t)) || topicGate.has(e.category);
          if (!inScope) continue;
        }
        const haystack = [e.title, e.titleNl, e.nlSummary, e.enSummary].filter(Boolean).join(" \n ");
        if (!re.test(haystack)) continue;
        if (requireRe && !requireRe.test(haystack)) continue;

        matched.push({
          id: e.id,
          title: e.title,
          titleNl: e.titleNl || e.title,
          category: e.category,
          topics: e.topics || [],
          stream: e.stream,
          origin: e.origin || null,
          significance: e.significance || 0,
          publishedAt: e.publishedAt || null,
          updatedAt: e.updatedAt || null,
          nlSummary: firstParagraph(e.nlSummary),
          enSummary: firstParagraph(e.enSummary),
          sourceUrl: (e.sourceRefs && e.sourceRefs[0] && e.sourceRefs[0].url) || null,
          sourceCount: (e.sourceRefs || []).length,
          signals: classify(haystack),
        });
      }

      if (!matched.length) continue;

      matched.sort((a, b) =>
        String(b.publishedAt || b.updatedAt).localeCompare(String(a.publishedAt || a.updatedAt)));

      const kept = matched.slice(0, MAX_PER_CARD);
      outCards[cardId] = {
        name: card.name,
        // Alleen gezet waar de NL-naam niet ook als EN werkt (systeemnamen zijn taalneutraal).
        nameEn: card.nameEn || card.name,
        total: matched.length,
        signalCount: kept.reduce((n, m) => n + (m.signals.length ? 1 : 0), 0),
        entries: kept,
      };
      totalMatches += matched.length;
      cardsWithHits++;
    }

    outSites[siteId] = {
      name: site.name,
      url: site.url || null,
      cards: outCards,
    };
  }

  const out = {
    updated: new Date().toISOString(),
    analysisUpdated: analysis.updated || null,
    window: WINDOW_DAYS + "d",
    stats: { entriesConsidered: entries.length, cardsWithHits: cardsWithHits, matches: totalMatches },
    signalLabels: SIGNALS.reduce((m, s) => { m[s.key] = s.label; return m; }, {}),
    sites: outSites,
  };

  fs.writeFileSync(path.join(PUBLIC_DIR, "crosscheck.json"), JSON.stringify(out, null, 1));
  const perSite = Object.keys(outSites).map(s => s + "=" + Object.keys(outSites[s].cards).length).join(" ");
  console.log(`crosscheck.json: ${cardsWithHits} kaarten met treffers (${perSite}), ${totalMatches} matches uit ${entries.length} entries`);
}

main();
