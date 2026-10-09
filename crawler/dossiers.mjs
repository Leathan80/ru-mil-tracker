#!/usr/bin/env node
/**
 * crawler/dossiers.mjs — statische dossierpagina's per topic.
 *
 * De tracker is een app: zonder JavaScript staat er 81 tekens op de pagina,
 * terwijl er honderdduizenden tekens eigen NL/EN-analyse achter zitten. Voor
 * een zoekmachine bestaat die inhoud dus niet.
 *
 * Losse entry-pagina's zijn daar niet het antwoord op. Eén entry concurreert
 * met de nieuwsbron die het verhaal zelf bracht, en die wint altijd; bovendien
 * komen er tien per dag bij, wat duizenden kortlevende pagina's oplevert.
 * Wat de tracker wél uniek heeft is het dóórlopende overzicht: alles over
 * luchtverdediging of EW, op datum, maandenlang, in twee talen. Dat is wat
 * hier wordt gebouwd — per topic één pagina die blijft groeien.
 *
 *   public/d/<topic>/       Nederlands
 *   public/en/d/<topic>/    Engels
 *   public/sitemap-dossiers.xml
 *
 * Het archief is de kern. public/analysis.json is een rollend venster van
 * ~90 dagen: de dagelijkse taak ruimt oudere entries op. Zou een dossier
 * daarop draaien, dan zou het krimpen in plaats van groeien. Daarom houdt dit
 * script een eigen append-only archief bij, dat alleen maar aangroeit.
 *
 * Alle zichtbare tekst komt uit de site zelf: topiclabels uit pretag.json,
 * chrome-tekst uit js/i18n.js, kleuren uit css. Hier wordt niets vertaald.
 *
 *   node crawler/dossiers.mjs           bijwerken
 *   node crawler/dossiers.mjs --check   alleen melden (exit 1 bij verschil)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WORTEL = resolve(HIER, '..');
const PUBLIEK = join(WORTEL, 'public');
const ARCHIEF = join(WORTEL, 'analysis', 'dossier-archief.json');
const BASIS = 'https://ru-mil-tracker.web.app';
const alleenControle = process.argv.includes('--check');

const lees = (p, standaard) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : standaard);
const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// --- invoer ----------------------------------------------------------------

function entriesUit(data) {
  if (Array.isArray(data)) return data;
  return data?.entries || data?.items || [];
}

// i18n.js is een IIFE die UI_NL en UI_EN op window hangt.
function uiPacks() {
  const w = {};
  new Function('window', readFileSync(join(PUBLIEK, 'js', 'i18n.js'), 'utf8'))(w);
  return { nl: w.UI_NL || {}, en: w.UI_EN || {} };
}

function kleuren() {
  const standaard = {
    bg: '#0b0d10', surface: '#0f1216', border: '#232a33',
    text: '#ccd2d8', strong: '#e8edf1', dim: '#6d7681', accent: '#4dd4ac',
  };
  try {
    const css = readdirSync(join(PUBLIEK, 'css'))
      .filter((f) => f.endsWith('.css'))
      .map((f) => readFileSync(join(PUBLIEK, 'css', f), 'utf8'))
      .join('\n');
    const pak = (naam, terug) => (css.match(new RegExp(`--${naam}:\\s*(#[0-9a-fA-F]{3,8})`)) || [])[1] || terug;
    return {
      bg: pak('bg', standaard.bg),
      surface: pak('surface', standaard.surface),
      border: pak('border', standaard.border),
      text: pak('text', standaard.text),
      strong: pak('text-strong', standaard.strong),
      dim: pak('text-dim', standaard.dim),
      accent: pak('accent', standaard.accent),
    };
  } catch {
    return standaard;
  }
}

// --- archief ---------------------------------------------------------------
// Append-only: entries die uit analysis.json zijn opgeruimd blijven hier staan.
// Een entry die opnieuw langskomt wordt bijgewerkt, nooit verwijderd.

function archiefBijwerken(verse) {
  const bestaand = lees(ARCHIEF, { entries: {} });
  const kaart = bestaand.entries || {};
  let nieuw = 0;
  for (const e of verse) {
    if (!e.id) continue;
    if (!kaart[e.id]) nieuw++;
    kaart[e.id] = e;
  }
  return { kaart, nieuw, totaal: Object.keys(kaart).length };
}

// --- uitvoer ---------------------------------------------------------------

const datum = (s) => String(s || '').slice(0, 10);

function pagina({ taal, titel, beschrijving, url, alt, k, inhoud, kruimel, ui }) {
  const hreflang = alt
    ? Object.entries(alt)
        .map(([t, u]) => `  <link rel="alternate" hreflang="${t}" href="${esc(u)}">`)
        .join('\n') + `\n  <link rel="alternate" hreflang="x-default" href="${esc(alt.en)}">`
    : '';
  return `<!DOCTYPE html>
<html lang="${taal}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(titel)}</title>
  <meta name="description" content="${esc(beschrijving)}">
  <link rel="canonical" href="${esc(url)}">
${hreflang}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(ui.brand || 'Russian Military Tracker')}">
  <meta property="og:title" content="${esc(titel)}">
  <meta property="og:description" content="${esc(beschrijving)}">
  <meta property="og:url" content="${esc(url)}">
  <style>
    :root { --bg:${k.bg}; --surface:${k.surface}; --border:${k.border}; --text:${k.text}; --strong:${k.strong}; --dim:${k.dim}; --accent:${k.accent}; }
    * { box-sizing: border-box; }
    body { margin:0; background:var(--bg); color:var(--text); font:16px/1.65 "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif; }
    main { max-width: 820px; margin:0 auto; padding:32px 16px 64px; }
    a { color: var(--accent); }
    .kruimel { font-size:14px; color:var(--dim); }
    .kruimel a { color:var(--dim); }
    h1 { font-size:28px; line-height:1.25; margin:12px 0 6px; color:var(--strong); }
    .intro { color:var(--dim); margin:0 0 20px; }
    .knop { display:inline-block; background:var(--accent); color:var(--bg); font-weight:600; text-decoration:none; padding:9px 16px; border-radius:6px; }
    .caveat { background:var(--surface); border:1px solid var(--border); border-left:3px solid var(--accent); border-radius:6px; padding:12px 14px; margin:18px 0; font-size:14px; }
    .caveat b { color:var(--strong); }
    article { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:14px 16px; margin:12px 0; }
    article h2 { font-size:18px; margin:0 0 4px; color:var(--strong); }
    .meta { font-size:13px; color:var(--dim); margin:0 0 8px; }
    .badge { display:inline-block; font-size:11px; letter-spacing:.06em; border:1px solid var(--border); border-radius:4px; padding:1px 6px; margin-left:6px; color:var(--dim); }
    .bronnen { font-size:13px; margin:8px 0 0; color:var(--dim); }
    .bronnen a { margin-right:4px; }
    .tegels { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; margin-top:18px; }
    .tegel { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:12px 14px; }
    .tegel a { font-weight:600; text-decoration:none; }
    .tegel span { display:block; color:var(--dim); font-size:13px; }
    .bladeren { display:flex; justify-content:space-between; gap:12px; margin-top:24px; font-size:14px; }
    .pag { color:var(--dim); font-size:18px; font-weight:400; }
    footer { margin-top:36px; font-size:13px; color:var(--dim); line-height:1.6; }
  </style>
</head>
<body>
<main>
  <p class="kruimel">${kruimel}</p>
${inhoud}
  <footer>
    <p>${esc(ui.brand || 'Russian Military Tracker')} — ${esc(ui.tagline || '')}<br>
    ${esc(ui.rawFeedDisclaimer || '')}</p>
  </footer>
</main>
</body>
</html>
`;
}

function entryBlok(e, taal, ui) {
  const titel = taal === 'en' ? e.title : e.titleNl || e.title;
  const samenvatting = (taal === 'en' ? e.enSummary : e.nlSummary) || '';
  const badges = [
    e.stream === 'single' ? ui.badgeSingle : null,
    e.milblogger ? ui.badgeMilblog : null,
  ].filter(Boolean);
  const bronnen = (e.sourceRefs || [])
    .filter((b) => b.url)
    .map((b) => `<a href="${esc(b.url)}" rel="nofollow noopener" target="_blank">${esc(b.source || b.title || b.url)}</a>`)
    .join(' · ');
  return `  <article>
    <h2>${esc(titel)}</h2>
    <p class="meta">${esc(datum(e.publishedAt))}${badges.map((b) => `<span class="badge">${esc(b)}</span>`).join('')}</p>
    <p>${esc(samenvatting)}</p>
${bronnen ? `    <p class="bronnen">${esc(ui.sources || 'Bronnen')}: ${bronnen}</p>` : ''}
  </article>`;
}

// Hoeveel entries op één pagina. Een dossier van 180 entries wordt anders
// 380 kB HTML: te traag om te laden, en groot genoeg dat een zoekmachine de
// staart afkapt. Met tien nieuwe entries per dag loopt dat alleen maar op,
// dus de dossiers zijn genummerd in plaats van onbegrensd.
const PER_PAGINA = 40;

// Onder deze grens geen eigen dossier. Een pagina met één of twee items is
// dun: weinig waard voor een lezer, en voor een zoekmachine eerder ballast dan
// inhoud. Het onderwerp blijft gewoon als filter in de app bestaan en krijgt
// vanzelf een dossier zodra het archief genoeg items heeft.
const MINIMAAL = 5;

const dossierPad = (topic, n) => (n === 1 ? `/d/${topic}/` : `/d/${topic}/p${n}/`);

function dossierPagina({ topic, label, entries, taal, ui, k, nr, vanTotaal, totaal }) {
  const vv = taal === 'nl' ? '' : '/en';
  const url = `${BASIS}${vv}${dossierPad(topic, nr)}`;
  const alt = { nl: `${BASIS}${dossierPad(topic, nr)}`, en: `${BASIS}/en${dossierPad(topic, nr)}` };
  const vanaf = datum(entries[entries.length - 1]?.publishedAt);
  const tot = datum(entries[0]?.publishedAt);
  const aantalSingle = entries.filter((e) => e.stream === 'single').length;

  // Het aantal op déze pagina én het totaal van het dossier. Alleen "40
  // ontwikkelingen" tonen terwijl er 180 in het dossier zitten, leest in een
  // zoekresultaat als een kleiner dossier dan het is.
  const vanVeel = vanTotaal > 1 ? (taal === 'en' ? ` (page ${nr} of ${vanTotaal}, ${totaal} in all)` : ` (pagina ${nr} van ${vanTotaal}, ${totaal} in totaal)`) : '';
  const beschrijving =
    taal === 'en'
      ? `${entries.length} tracked developments on ${label} in the Russian armed forces, ${vanaf} to ${tot}${vanVeel}, with sources.`
      : `${entries.length} gevolgde ontwikkelingen rond ${label} bij de Russische strijdkrachten, ${vanaf} tot ${tot}${vanVeel}, met bronnen.`;

  const bladeren =
    vanTotaal > 1
      ? `  <nav class="bladeren">
    ${nr > 1 ? `<a href="${vv}${dossierPad(topic, nr - 1)}">← ${nr - 1}</a>` : '<span></span>'}
    <span>${nr} / ${vanTotaal}</span>
    ${nr < vanTotaal ? `<a href="${vv}${dossierPad(topic, nr + 1)}">${nr + 1} →</a>` : '<span></span>'}
  </nav>`
      : '';

  const inhoud = `  <h1>${esc(label)}${vanTotaal > 1 ? ` <span class="pag">${nr}/${vanTotaal}</span>` : ''}</h1>
  <p class="intro">${esc(beschrijving)}</p>
  <p><a class="knop" href="${vv}/">${esc(ui.brand || 'Russian Military Tracker')} →</a></p>
${aantalSingle ? `  <div class="caveat"><b>${esc(ui.noteSingleT || 'Single source')}</b> — ${esc(ui.noteSingleB || '')}</div>` : ''}
${entries.map((e) => entryBlok(e, taal, ui)).join('\n')}
${bladeren}`;

  return pagina({
    taal,
    titel: `${label}${vanTotaal > 1 ? ` (${nr}/${vanTotaal})` : ''} — ${ui.brand || 'Russian Military Tracker'}`,
    beschrijving,
    url,
    alt,
    k,
    ui,
    inhoud,
    kruimel: `<a href="${vv}/">${esc(ui.brand || 'Russian Military Tracker')}</a> · <a href="${vv}/d/">${esc(ui.topicsLabel || 'Topics')}</a> · ${esc(label)}`,
  });
}

function overzichtPagina({ rijen, taal, ui, k }) {
  const vv = taal === 'nl' ? '' : '/en';
  const url = `${BASIS}${vv}/d/`;
  const beschrijving =
    taal === 'en'
      ? 'Running dossiers per topic: every tracked development on Russian military change, grouped and dated, with sources.'
      : 'Doorlopende dossiers per onderwerp: elke gevolgde ontwikkeling in de Russische krijgsmacht, gegroepeerd en gedateerd, met bronnen.';
  const tegels = rijen
    .map(
      ({ topic, label, n }) => `    <div class="tegel"><a href="${vv}/d/${topic}/">${esc(label)}</a><span>${n}</span></div>`
    )
    .join('\n');
  return pagina({
    taal,
    titel: `${ui.topicsLabel || 'Topics'} — ${ui.brand || 'Russian Military Tracker'}`,
    beschrijving,
    url,
    alt: { nl: `${BASIS}/d/`, en: `${BASIS}/en/d/` },
    k,
    ui,
    inhoud: `  <h1>${esc(ui.topicsLabel || 'Topics')}</h1>
  <p class="intro">${esc(beschrijving)}</p>
  <p><a class="knop" href="${vv}/">${esc(ui.brand || 'Russian Military Tracker')} →</a></p>
  <div class="tegels">
${tegels}
  </div>`,
    kruimel: `<a href="${vv}/">${esc(ui.brand || 'Russian Military Tracker')}</a> · ${esc(ui.topicsLabel || 'Topics')}`,
  });
}

// --- hoofdlijn -------------------------------------------------------------

const analyse = entriesUit(lees(join(PUBLIEK, 'analysis.json'), []));
const pretag = lees(join(PUBLIEK, 'pretag.json'), {});
const labels = pretag.topics || {};
const ui = uiPacks();
const k = kleuren();

const { kaart, nieuw, totaal } = archiefBijwerken(analyse);
const alles = Object.values(kaart).sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));

const perTopic = new Map();
for (const e of alles) for (const t of e.topics || []) perTopic.set(t, [...(perTopic.get(t) || []), e]);

const uit = {};
const urls = [];
const rijen = { nl: [], en: [] };

// Welke paginamappen per topic horen te bestaan; de opruimlus verderop
// gebruikt dit om genummerde pagina's weg te halen die door een krimpend
// dossier niet meer nodig zijn.
const paginasPer = new Map();
const tedun = [];

for (const [topic, entries] of [...perTopic.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const label = labels[topic];
  if (!label) continue; // zonder label van de site zelf geen pagina
  if (entries.length < MINIMAAL) {
    tedun.push(`${label.nl || topic} (${entries.length})`);
    continue;
  }
  const vanTotaal = Math.max(1, Math.ceil(entries.length / PER_PAGINA));
  paginasPer.set(topic, vanTotaal);

  for (let nr = 1; nr <= vanTotaal; nr++) {
    const deel = entries.slice((nr - 1) * PER_PAGINA, nr * PER_PAGINA);
    for (const taal of ['nl', 'en']) {
      const vv = taal === 'nl' ? [] : ['en'];
      const map = nr === 1 ? ['d', topic] : ['d', topic, `p${nr}`];
      uit[join(PUBLIEK, ...vv, ...map, 'index.html')] = dossierPagina({
        topic, label: label[taal] || label.en, entries: deel, taal, ui: ui[taal], k, nr, vanTotaal, totaal: entries.length,
      });
    }
    urls.push(dossierPad(topic, nr), `/en${dossierPad(topic, nr)}`);
  }

  for (const taal of ['nl', 'en']) {
    rijen[taal].push({ topic, label: label[taal] || label.en, n: entries.length });
  }
}

for (const taal of ['nl', 'en']) {
  const vv = taal === 'nl' ? [] : ['en'];
  uit[join(PUBLIEK, ...vv, 'd', 'index.html')] = overzichtPagina({ rijen: rijen[taal], taal, ui: ui[taal], k });
}
urls.push('/d/', '/en/d/');

uit[join(PUBLIEK, 'sitemap-dossiers.xml')] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.sort().map((u) => `  <url><loc>${esc(BASIS + u)}</loc></url>`).join('\n')}
</urlset>
`;

// Topics die niet meer voorkomen: hun map opruimen.
const weg = [];
for (const vv of [[], ['en']]) {
  const map = join(PUBLIEK, ...vv, 'd');
  if (!existsSync(map)) continue;
  for (const d of readdirSync(map)) {
    if (d === 'index.html') continue;
    // Topic bestaat niet meer, of heeft geen label van de site: hele map weg.
    if (!paginasPer.has(d)) {
      weg.push(join(map, d));
      continue;
    }
    // Topic bestaat nog, maar is korter geworden: overtollige p<n> weg.
    const max = paginasPer.get(d);
    for (const sub of readdirSync(join(map, d))) {
      const m = /^p(\d+)$/.exec(sub);
      if (m && Number(m[1]) > max) weg.push(join(map, d, sub));
    }
  }
}

const veranderd = Object.entries(uit).filter(
  ([pad, inhoud]) => !existsSync(pad) || readFileSync(pad, 'utf8') !== inhoud
);

console.log(`archief: ${totaal} entries (${nieuw} nieuw), ${perTopic.size} topics, ${paginasPer.size} dossiers`);
if (tedun.length) console.log(`  nog te dun voor een dossier (< ${MINIMAAL}): ${tedun.join(', ')}`);
for (const [pad] of veranderd) console.log(`${alleenControle ? 'ZOU  ' : 'SCHRIJF'} ${pad.replace(WORTEL + '\\', '').split('\\').join('/')}`);
for (const pad of weg) console.log(`${alleenControle ? 'ZOU  ' : 'WEG  '} ${pad.replace(WORTEL + '\\', '').split('\\').join('/')}`);

if (alleenControle) {
  const n = veranderd.length + weg.length;
  console.log(n ? `\ndossiers: ${n} bestand(en) verouderd` : '\ndossiers: alles actueel');
  process.exit(n ? 1 : 0);
}

mkdirSync(dirname(ARCHIEF), { recursive: true });
writeFileSync(ARCHIEF, JSON.stringify({ bijgewerkt: new Date().toISOString(), entries: kaart }, null, 1));
for (const [pad, inhoud] of veranderd) {
  mkdirSync(dirname(pad), { recursive: true });
  writeFileSync(pad, inhoud);
}
for (const pad of weg) rmSync(pad, { recursive: true, force: true });
console.log(`\ndossiers: ${veranderd.length} geschreven, ${weg.length} verwijderd`);
