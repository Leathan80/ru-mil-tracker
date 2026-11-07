// Controle van de gestructureerde velden in public/analysis.json.
//
// Sinds 8 november 2026 schrijft de dagelijkse taak per entry ook:
//   countries   landen waar de ontwikkeling over gaat (spelling uit crawler/landen.json)
//   milestones  (optioneel) mijlpalen voor de vijf kernsystemen, voor het meten van de
//               aanpassingscyclus: wanneer verschijnt een variant, wanneer een tegenmaatregel
//
// Die velden zijn een oordeel van de analist, geen trefwoordtreffer; daarom staan ze in de
// pijplijn en niet in een script achteraf. Dit script controleert alleen de vorm.
// Entries van vóór de ingangsdatum hoeven de velden niet te hebben.
//
// Fouten → exitcode 1 (deploy.ps1 stopt dan). Onbekende landnamen zijn een waarschuwing:
// kleine staten ontbreken in de kaart (Natural Earth 1:110m), dus controleer de spelling.
//
// Gebruik: node crawler/valideer.mjs [pad/naar/analysis.json]

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const BESTAND = process.argv[2] || join(HIER, '..', 'public', 'analysis.json');
export const INGANG = '2026-11-08';
export const SYSTEMEN = ['geran', 'gerbera', 'kn-23', 'umpk', 'lancet'];
export const SOORTEN = ['variant', 'adaptation', 'countermeasure', 'scale', 'first-use'];
export const CLAIMANTS = ['ua', 'ru', 'west', 'independent', 'other'];

const landen = new Set(JSON.parse(readFileSync(join(HIER, 'landen.json'), 'utf8')).namen);
const data = JSON.parse(readFileSync(BESTAND, 'utf8'));
const entries = Array.isArray(data.entries) ? data.entries : Object.values(data.entries || {});

const fouten = [], let_op = [];
let gecontroleerd = 0, metMijlpaal = 0;
for (const e of entries) {
  const nieuw = String(e.firstSeen || '').slice(0, 10) >= INGANG;
  if (!nieuw && e.countries === undefined && e.milestones === undefined) continue;
  gecontroleerd++;
  const w = e.id || '(zonder id)';
  if (nieuw && !e.firstSeen) fouten.push(`${w}: firstSeen ontbreekt`);
  if (!Array.isArray(e.countries) || !e.countries.length) fouten.push(`${w}: "countries" ontbreekt of is leeg`);
  else {
    if (new Set(e.countries).size !== e.countries.length) fouten.push(`${w}: dubbel land in "countries"`);
    for (const l of e.countries) if (!landen.has(l)) let_op.push(`${w}: land "${l}" staat niet in crawler/landen.json (spelling?)`);
  }
  if (e.milestones !== undefined) {
    if (!Array.isArray(e.milestones)) { fouten.push(`${w}: "milestones" moet een lijst zijn`); continue; }
    if (e.milestones.length) metMijlpaal++;
    e.milestones.forEach((m, i) => {
      const mw = `${w} mijlpaal ${i + 1}`;
      if (!SYSTEMEN.includes(m.system)) fouten.push(`${mw}: system "${m.system}" (toegestaan: ${SYSTEMEN.join(', ')})`);
      if (!SOORTEN.includes(m.type)) fouten.push(`${mw}: type "${m.type}" (toegestaan: ${SOORTEN.join(', ')})`);
      if (!CLAIMANTS.includes(m.claimant)) fouten.push(`${mw}: claimant "${m.claimant}" (toegestaan: ${CLAIMANTS.join(', ')})`);
      if (!m.note || m.note.length < 10) fouten.push(`${mw}: "note" ontbreekt (wat is er precies nieuw?)`);
    });
  }
}

for (const m of let_op) console.warn('let op: ' + m);
if (fouten.length) {
  for (const m of fouten) console.error('FOUT: ' + m);
  console.error(`\n${fouten.length} fout(en) in ${BESTAND}; herstel de entries en draai opnieuw.`);
  process.exit(1);
}
console.log(`valideer: ${gecontroleerd} entries met countries/milestones gecontroleerd, ${metMijlpaal} met mijlpalen; in orde.`);
