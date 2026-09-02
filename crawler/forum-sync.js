// Koppelt de tracker aan het Adepti Forum (project ew-leeromgeving).
//
// Vier taken, alle vier non-fataal bedoeld — de crawler mag hier nooit op
// stuklopen, net zoals bij crosscheck.js:
//
//   1. public/entities.json schrijven: de clientvriendelijke vorm van
//      cardmap.json, die het forum ophaalt om systemen in een bericht te
//      herkennen. Dit deel werkt ook zonder Firestore-credentials.
//   2. Discussiedraden aanmaken voor de zwaarste nieuwsitems, en de
//      wekelijkse Corroboration Watch met de onbevestigde meldingen.
//   3. De verdicts uit die watch terugschrijven naar
//      public/forum-verdicts.json, zodat de dagelijkse analysetaak ziet
//      wat de community heeft uitgezocht.
//   4. public/forum-index.json schrijven: de laatste draden en het aantal
//      discussies per kaart-id, zodat de zustersites die statisch kunnen
//      lezen in plaats van Firestore rechtstreeks aan te roepen. Dat is
//      wat App Check enforced-zetten mogelijk maakt.
//
// Kaartwaarden worden NOOIT gewijzigd — zelfde afspraak als crosscheck.js:
// dit is een hulpmiddel, de mens beslist.
//
// Credentials: env FIREBASE_SERVICE_ACCOUNT_ADEPTI_FORUM met de JSON van een
// service-account uit project ew-leeromgeving. Ontbreekt die, dan doet dit
// script alleen taak 1 en stopt netjes.

const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const FORUM_PROJECT = "ew-leeromgeving";
const FORUM_URL = "https://forum.adepti-academy.nl";

// Alleen de zwaarste items krijgen vanzelf een draad. significance loopt van
// 1 tot 3; op 3 gaat het om een handvol per week, wat het forum vult zonder
// het te laten dichtslibben met draden waar niemand op reageert.
const NEWS_MIN_SIGNIFICANCE = 3;

// De Corroboration Watch: onbevestigd, noemenswaardig, en het raakt een
// systeem uit de lesstof. Zonder dat laatste filter zijn het er te veel.
const CORROBORATION_MIN_SIGNIFICANCE = 2;
const CORROBORATION_WINDOW_DAYS = 7;

/* ---------- helpers ---------- */

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isoWeekId(date) {
  // ISO-8601 weeknummer; bepaalt het document-id van de watch-draad en
  // zorgt er zo voor dat een tweede run in dezelfde week niets dupliceert.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return d.getUTCFullYear() + "-w" + String(week).padStart(2, "0");
}

/* ---------- 1. entities.json ---------- */

function buildEntities() {
  const cardmap = readJson(path.join(__dirname, "cardmap.json"));
  const entities = [];
  for (const [siteKey, site] of Object.entries(cardmap.sites || {})) {
    for (const [id, card] of Object.entries(site.cards || {})) {
      entities.push({
        id,
        name: card.name,
        match: card.match,
        require: card.require || null,
        topics: card.topics || null,
        site: siteKey,
        siteName: site.name,
        siteUrl: site.url,
      });
    }
  }
  fs.writeFileSync(path.join(PUBLIC_DIR, "entities.json"), JSON.stringify(entities, null, 1));
  console.log("entities.json: " + entities.length + " kaarten");
  return entities;
}

/* ---------- kaartkoppeling ---------- */

// Zelfde bepaling als crosscheck.js, zodat een bericht en een tracker-entry
// dezelfde kaart-id's opleveren.
function cardsFor(entry, entities) {
  const hay = [entry.title, entry.titleNl, entry.enSummary, entry.nlSummary]
    .filter(Boolean).join(" \n ");
  const hits = [];
  for (const e of entities) {
    let match, req;
    try { match = new RegExp(e.match, "i"); } catch (err) { continue; }
    if (!match.test(hay)) continue;
    if (e.require) {
      try { req = new RegExp(e.require, "i"); } catch (err) { req = null; }
      if (req && !req.test(hay)) continue;
    }
    if (e.topics && !(entry.topics || []).some((t) => e.topics.includes(t))) continue;
    hits.push(e.id);
  }
  return [...new Set(hits)].slice(0, 8);
}

/* ---------- Firestore ---------- */

function firestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_ADEPTI_FORUM;
  if (!raw) {
    console.log("geen service-account in de omgeving — Firestore-stappen overgeslagen");
    return null;
  }
  // De modulaire sub-paden, niet het oude `require("firebase-admin")`-object:
  // vanaf v13 bestaat `admin.apps` daar niet meer.
  let getApps, initializeApp, cert, getFirestore, FieldValue;
  try {
    ({ getApps, initializeApp, cert } = require("firebase-admin/app"));
    ({ getFirestore, FieldValue } = require("firebase-admin/firestore"));
  } catch (err) {
    console.log("firebase-admin niet geinstalleerd — Firestore-stappen overgeslagen");
    return null;
  }

  // Onbruikbare credentials mogen dit script niet laten vallen: het hoort
  // non-fataal te zijn, net als crosscheck.js. Een ingetrokken sleutel of
  // stukgelopen secret levert dus een melding op, geen stacktrace.
  try {
    const credential = JSON.parse(raw);
    if (!getApps().length) {
      initializeApp({ credential: cert(credential), projectId: FORUM_PROJECT });
    }
    return { db: getFirestore(), FieldValue };
  } catch (err) {
    console.error("service-account onbruikbaar (" + err.message +
      ") — Firestore-stappen overgeslagen");
    return null;
  }
}

/* ---------- 2a. nieuwsdraden ---------- */

async function syncNewsThreads(db, FieldValue, analysis, entities) {
  const top = (analysis.entries || []).filter(
    (e) => (e.significance || 0) >= NEWS_MIN_SIGNIFICANCE
  );
  let created = 0;

  for (const entry of top) {
    // Dedupe op sourceRef: een tweede run mag geen tweede draad opleveren.
    const existing = await db.collection("threads")
      .where("sourceRef", "==", entry.id).limit(1).get();
    if (!existing.empty) continue;

    const summary = String(entry.enSummary || entry.nlSummary || "")
      .replace(/^SINGLE SOURCE\s*—\s*/i, "")
      .slice(0, 900);
    const source = (entry.sourceRefs || [])[0] || {};

    await db.collection("threads").add({
      title: String(entry.title || "").slice(0, 140),
      body: "Opened automatically from the tracker.\n\n> " + summary +
        "\n\nSource entry `" + entry.id + "` — significance " + (entry.significance || 0) +
        (source.source ? " — " + source.source : "") + ".",
      section: "news",
      type: "thread",
      entities: cardsFor(entry, entities),
      ctx: null,
      sourceRef: entry.id,
      authorUid: "tracker",
      authorName: "tracker",
      createdAt: FieldValue.serverTimestamp(),
      lastReply: FieldValue.serverTimestamp(),
      replyCount: 0,
      status: null,
      votes: 0,
      pinned: false,
      locked: false,
      hidden: false,
      autoGenerated: true,
    });
    created++;
  }
  console.log("nieuwsdraden: " + created + " nieuw van " + top.length + " kandidaten");
}

/* ---------- 2b. Corroboration Watch ---------- */

async function syncCorroboration(db, FieldValue, analysis, entities) {
  const cutoff = Date.now() - CORROBORATION_WINDOW_DAYS * 86400000;

  const items = (analysis.entries || [])
    .filter((e) => e.stream === "single")
    .filter((e) => (e.significance || 0) >= CORROBORATION_MIN_SIGNIFICANCE)
    .map((e) => ({ entry: e, cards: cardsFor(e, entities) }))
    .filter((x) => x.cards.length > 0)
    .filter((x) => {
      const ts = Date.parse(x.entry.updatedAt || x.entry.publishedAt || "");
      return Number.isFinite(ts) ? ts >= cutoff : false;
    })
    .slice(0, 8)
    .map((x) => ({
      entryId: x.entry.id,
      title: String(x.entry.title || "").slice(0, 200),
      source: ((x.entry.sourceRefs || [])[0] || {}).source || "unknown",
      origin: x.entry.origin || "",
      summary: String(x.entry.enSummary || x.entry.nlSummary || "")
        .replace(/^SINGLE SOURCE\s*—\s*/i, "").slice(0, 300),
      cards: x.cards,
      status: "open",
    }));

  if (!items.length) {
    console.log("corroboration watch: geen kandidaten deze week");
    return;
  }

  const weekId = isoWeekId(new Date());
  const ref = db.collection("threads").doc("corroboration-" + weekId);
  const snap = await ref.get();

  if (snap.exists) {
    // Bestaande draad aanvullen zonder de statussen te overschrijven die
    // de beheerder al heeft gezet.
    const current = snap.data().items || [];
    const known = new Set(current.map((i) => i.entryId));
    const added = items.filter((i) => !known.has(i.entryId));
    if (!added.length) {
      console.log("corroboration watch: niets nieuws deze week");
      return;
    }
    await ref.update({ items: current.concat(added) });
    console.log("corroboration watch: " + added.length + " item(s) toegevoegd");
    return;
  }

  await ref.set({
    title: "Corroboration watch — " + items.length + " unverified reports",
    body: "Single-source reports from this week that touch a system in the course " +
      "material. Confirm or refute with a source, and say how confident you are.\n\n" +
      "Selection: `stream = single` **and** `significance >= " +
      CORROBORATION_MIN_SIGNIFICANCE + "` **and** at least one card match.",
    section: "news",
    type: "corroboration",
    entities: [...new Set(items.flatMap((i) => i.cards))].slice(0, 8),
    items,
    ctx: null,
    sourceRef: null,
    authorUid: "tracker",
    authorName: "tracker",
    createdAt: FieldValue.serverTimestamp(),
    lastReply: FieldValue.serverTimestamp(),
    replyCount: 0,
    status: null,
    votes: 0,
    pinned: true,
    locked: false,
    hidden: false,
    autoGenerated: true,
  });
  console.log("corroboration watch: draad " + weekId + " aangemaakt met " + items.length + " items");
}

/* ---------- 3. verdicts terug ---------- */

async function exportVerdicts(db) {
  const snap = await db.collection("threads")
    .where("type", "==", "corroboration").get();

  const out = { updated: new Date().toISOString(), entries: {} };

  for (const doc of snap.docs) {
    for (const item of doc.data().items || []) {
      out.entries[item.entryId] = { status: item.status || "open", verdicts: [] };
    }
    const posts = await doc.ref.collection("posts").get();
    for (const p of posts.docs) {
      const d = p.data();
      if (!d.verdict || !d.entryId || d.hidden) continue;
      if (!out.entries[d.entryId]) out.entries[d.entryId] = { status: "open", verdicts: [] };
      out.entries[d.entryId].verdicts.push({
        verdict: d.verdict,
        sources: d.sources || [],
        by: d.authorName || "unknown",
      });
    }
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, "forum-verdicts.json"), JSON.stringify(out, null, 1));
  console.log("forum-verdicts.json: " + Object.keys(out.entries).length + " entries");
}

/* ---------- 4. forum-index.json voor de zustersites ----------

   De landingpagina en de threat-cards toonden aanvankelijk live Firestore-
   data via een ongeauthenticeerde REST-query. Dat botst met App Check: zodra
   je dat afdwingt, worden zulke aanroepen geweigerd en breken die blokken.
   Bovendien moest de apiKey er dan op drie plekken in.

   Daarom publiceert de crawler hier een statisch bestand, precies zoals de
   zustersites crosscheck.json al lezen. Prijs: de tellers zijn zo vers als
   de laatste crawlerrun in plaats van live — voor een discussieteller ruim
   voldoende. */

const INDEX_LATEST = 6;

async function exportForumIndex(db) {
  // De Admin SDK passeert de rules, dus verborgen draden moeten hier
  // expliciet worden weggefilterd.
  const snap = await db.collection("threads")
    .where("hidden", "==", false)
    .orderBy("lastReply", "desc")
    .limit(200)
    .get();

  const latest = [];
  const cards = {};

  for (const doc of snap.docs) {
    const d = doc.data();
    const when = d.lastReply && d.lastReply.toDate
      ? d.lastReply.toDate().toISOString()
      : null;

    if (latest.length < INDEX_LATEST) {
      latest.push({
        id: doc.id,
        title: d.title || "",
        section: d.section || "news",
        authorName: d.authorName || "unknown",
        replyCount: d.replyCount || 0,
        lastReply: when,
      });
    }

    for (const cardId of d.entities || []) {
      if (!cards[cardId]) cards[cardId] = { threads: 0, latest: [] };
      cards[cardId].threads++;
      if (cards[cardId].latest.length < 3) {
        cards[cardId].latest.push({
          id: doc.id,
          title: d.title || "",
          replyCount: d.replyCount || 0,
        });
      }
    }
  }

  const out = {
    updated: new Date().toISOString(),
    forumUrl: FORUM_URL,
    total: snap.size,
    latest,
    cards,
  };

  fs.writeFileSync(path.join(PUBLIC_DIR, "forum-index.json"), JSON.stringify(out, null, 1));
  console.log("forum-index.json: " + snap.size + " draden, " +
    Object.keys(cards).length + " kaarten met discussie");
}

/* ---------- main ---------- */

async function main() {
  let entities;
  try {
    entities = buildEntities();
  } catch (err) {
    console.error("entities.json mislukt: " + err.message);
    return;
  }

  let analysis;
  try {
    analysis = readJson(path.join(PUBLIC_DIR, "analysis.json"));
  } catch (err) {
    console.log("geen analysis.json — forum-synchronisatie overgeslagen");
    return;
  }

  const fb = firestore();
  if (!fb) return;

  try {
    await syncNewsThreads(fb.db, fb.FieldValue, analysis, entities);
    await syncCorroboration(fb.db, fb.FieldValue, analysis, entities);
    await exportVerdicts(fb.db);
    await exportForumIndex(fb.db);
  } catch (err) {
    console.error("forum-synchronisatie mislukt: " + err.message);
  }
}

main();
