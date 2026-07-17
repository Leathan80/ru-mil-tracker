// Pre-tagger voor de RU Military Tracker — analoog aan threat-review.js van het
// Intel Briefing Dashboard. Leest public/feed.json, kent per item kandidaat-
// categorieën (ttp/weapon/org) en topic-tags toe op basis van trefwoorden
// (Engels + Cyrillisch, want de single-stroom is Russisch/Oekraïenstalig) en
// schrijft public/pretag.json: de shortlist voor de dagelijkse Claude-analyse.
// Wijzigt NOOIT zelf data — een mens/analysetaak beslist.

const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");

// Topic-ids worden 1-op-1 hergebruikt door de site-UI (chips/filters).
const TOPICS = {
  "drones":         { nl: "Drones/FPV",      en: "Drones/FPV",      re: /\b(drone|uav|fpv|loitering|shahed|geran-?\d*|lancet|orlan|zala|quadcopter|interceptor drone|дрон\w*|бпла|бпак|беспилотн\w*|безпілотн\w*)\b/i },
  "naval-drones":   { nl: "Maritieme drones", en: "Naval drones",   re: /\b(naval drone|sea drone|usv|magura|sea baby|морск\w+ дрон\w*|морськ\w+ дрон\w*)\b/i },
  "ew":             { nl: "Elektronische oorlogvoering", en: "Electronic warfare", re: /\b(electronic warfare|jamming|jammer|spoofing|gps denial|krasukha|zhitel|pole-21|рэб|радиоэлектронн\w*|реб|глушени\w*)\b/i },
  "glide-bombs":    { nl: "Glijbommen",      en: "Glide bombs",     re: /\b(glide bomb|fab-?\d+|umpk|umpb|kab|планирующ\w+ бомб\w*|керован\w+ авіабомб\w*|каб)\b/i },
  "missiles":       { nl: "Raketten",        en: "Missiles",        re: /\b(missile|iskander|kinzhal|kalibr|kh-\d+|zircon|tsirkon|oreshnik|ballistic|cruise missile|ракет\w*|крылат\w*)\b/i },
  "artillery":      { nl: "Artillerie",      en: "Artillery",       re: /\b(artillery|howitzer|msta|tornado-s|smerch|grad|counter-battery|mlrs|артиллери\w*|гаубиц\w*|артилері\w*)\b/i },
  "armor":          { nl: "Pantser",         en: "Armor",           re: /\b(tank|t-\d{2}m?\d?|bmp|btr|armored vehicle|apc|ifv|танк\w*|бронетехник\w*|бмп|бтр)\b/i },
  "air-defense":    { nl: "Luchtverdediging", en: "Air defense",    re: /\b(air defen[cs]e|s-[345]00|s-350|pantsir|buk|tor-m|sam system|surface-to-air|пво|ппо|зрк|с-[345]00|панцир\w*)\b/i },
  "airforce":       { nl: "Luchtmacht",      en: "Air force",       re: /\b(su-\d+|mig-\d+|tu-\d+|fighter jet|bomber|sortie|vks|awacs|a-50|истребител\w*|бомбардировщик\w*|авиаци\w*|авіаці\w*)\b/i },
  "navy":           { nl: "Marine",          en: "Navy",            re: /\b(navy|fleet|frigate|corvette|submarine|black sea fleet|kilo-class|флот\w*|фрегат\w*|подводн\w+ лодк\w*|корабл\w*)\b/i },
  "vdv":            { nl: "VDV/elite-eenheden", en: "VDV/elite units", re: /\b(vdv|airborne|paratrooper|spetsnaz|naval infantry|marines brigade|вдв|десант\w*|спецназ\w*|морск\w+ пехот\w*)\b/i },
  "mobilization":   { nl: "Mobilisatie/werving", en: "Mobilization/recruitment", re: /\b(mobili[sz]ation|conscript|recruit(?:ment|ing|s)?|contract soldiers?|draft|volunteer battalion|мобилизаци\w*|призыв\w*|контрактник\w*|мобілізаці\w*)\b/i },
  "command":        { nl: "Commandovoering", en: "Command",         re: /\b(commander|general staff|appointed|dismissed|sacked|chain of command|command post|командующ\w*|генерал\w*|назначен\w*|снят\w*|командуванн\w*)\b/i },
  "logistics":      { nl: "Logistiek",       en: "Logistics",       re: /\b(logistics|ammunition supply|depot|railway|supply lines?|arsenal|fuel depot|логистик\w*|боеприпас\w*|склад\w*|логістик\w*)\b/i },
  "north-korea":    { nl: "Noord-Korea",     en: "North Korea",     re: /\b(north korean?|dprk|pyongyang|kn-23|кндр|северокорейск\w*|північнокорейськ\w*)\b/i },
  "fortifications": { nl: "Fortificaties",   en: "Fortifications",  re: /\b(fortification|dragon.s teeth|trench(?:es)?|defensive lines?|minefields?|фортификаци\w*|окоп\w*|укреплени\w*|фортифікаці\w*)\b/i },
  "doctrine":       { nl: "Doctrine",        en: "Doctrine",        re: /\b(doctrine|military thought|military science|operational art|deep battle|lessons learned|доктрин\w*|военная мысль|военн\w+ наук\w*|оперативн\w+ искусств\w*)\b/i },
};

// Categoriebuckets: meerdere per item toegestaan; de analysetaak kiest er één.
const CATS = {
  ttp: /\b(tactics?|ttp|assault (?:group|unit|detachment)|storm(?:ing)? group|infiltrat\w*|small.group|human wave|meat (?:assault|grinder)|fibre.optic|fiber.optic|jamming|spoofing|ambush|breach\w*|counter.battery|recon.strike|strike (?:package|chain)|kill chain|doctrine|adapt(?:ed|ation|ing)|new tactic\w*|тактик\w*|штурмов\w*|просачивани\w*|инфильтраци\w*|огнев\w+ поражени\w*)\b/i,
  weapon: /\b(shahed|geran-?\d*|lancet|iskander|kinzhal|kalibr|zircon|tsirkon|oreshnik|kh-\d+|fab-?\d+|umpk|glide bomb|s-[345]00|pantsir|buk|tor-m\d?|t-\d{2}m?\d?|bmp|btr|msta|tornado-s|su-\d+|mig-\d+|tu-\d+|missile|drone|uav|loitering|new (?:variant|version|missile|drone)|upgraded|moderni[sz]ed|prototype|unveil\w*|entered service|serial production|новейш\w*|модернизирован\w*|принят\w* на вооружение|серийн\w+ производств\w*)\b/i,
  org: /\b(brigades?|regiments?|divisions?|army corps|combined arms army|military district|commander|appointed|dismissed|sacked|reorgani[sz]\w*|restructur\w*|new formation|formed|disbanded|mobili[sz]ation|conscript\w*|recruit\w*|contract soldiers?|vdv|airborne|spetsnaz|rosgvardia|africa corps|storm-z|north korean troops|dprk|бригад\w*|полк\w*|дивизи\w*|армейск\w+ корпус\w*|военн\w+ округ\w*|формировани\w*|переформирован\w*|назначен\w*|расформирован\w*)\b/i,
};

const CAT_WEIGHT = 2;

function main() {
  const feedPath = path.join(PUBLIC_DIR, "feed.json");
  let feed;
  try { feed = JSON.parse(fs.readFileSync(feedPath, "utf8")); }
  catch { console.error("feed.json ontbreekt of is onleesbaar — pretag overgeslagen"); return; }

  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "sources.json"), "utf8"));
  const hints = {};
  const weights = {};
  for (const s of cfg.sources) { hints[s.id] = s.categoryHints || []; weights[s.id] = s.weight || 1; }

  const candidates = [];
  for (const it of feed.items || []) {
    const text = (it.title || "") + " " + (it.summaryRaw || "");
    const cats = Object.keys(CATS).filter(c => CATS[c].test(text));
    const topics = Object.keys(TOPICS).filter(t => TOPICS[t].re.test(text));

    // Zonder een directe categorie- of topic-treffer is er niets om op te selecteren — overslaan.
    if (!cats.length && !topics.length) continue;

    let score = cats.length * CAT_WEIGHT + topics.length + (weights[it.source] || 1);
    // Bron-hint: bij een topic-treffer maar geen categorie-treffer (vage vaktaal
    // rond een herkend onderwerp) telt de bron-hint licht mee als kandidaat-categorie.
    // Zonder enige topic-treffer is een hint te zwak signaal — dan geen categorie toekennen.
    if (!cats.length && topics.length) {
      for (const h of hints[it.source] || []) {
        if (!cats.includes(h)) { cats.push(h); score += 1; break; }
      }
    }

    candidates.push({
      id: it.id, title: it.title, url: it.url,
      source: it.source, sourceName: it.sourceName,
      stream: it.stream, origin: it.origin || null, state: !!it.state,
      date: it.date, categories: cats, topics, score,
    });
  }

  candidates.sort((a, b) => b.score - a.score || (b.date || "").localeCompare(a.date || ""));

  const out = {
    updated: new Date().toISOString(),
    feedUpdated: feed.updated || null,
    count: candidates.length,
    topics: Object.fromEntries(Object.entries(TOPICS).map(([id, t]) => [id, { nl: t.nl, en: t.en }])),
    candidates,
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, "pretag.json"), JSON.stringify(out, null, 1));
  console.log(`pretag.json: ${candidates.length} kandidaten uit ${(feed.items || []).length} items`);
}

main();
