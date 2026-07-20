# Dagelijkse analyseprocedure — RU Military Tracker

Deze procedure wordt gevolgd door de dagelijkse geplande Claude-taak
(`ru-mil-tracker-daily-analysis`, ~07:00 lokaal). Werk vanuit
`C:\Users\Weste\OneDrive\Documenten\Claude\ru-mil-tracker\`.

## Eigendomsregel

`public/analysis.json` en `public/history.json` zijn eigendom van déze taak.
`public/feed.json` en `public/pretag.json` zijn eigendom van de cloud-crawler
(GitHub Actions) — nooit handmatig bewerken, alleen lezen.

## Stappen

1. **Sync crawler-data van de live site** (niet vertrouwen op lokale kopieën,
   die kunnen verouderd zijn):
   ```powershell
   curl.exe -sf https://ru-mil-tracker.web.app/feed.json -o public/feed.json
   curl.exe -sf https://ru-mil-tracker.web.app/pretag.json -o public/pretag.json
   ```

2. **Lees de shortlist**: `public/pretag.json` → `candidates`, gesorteerd op
   score. Neem de top ~40. Vergelijk met bestaande `public/analysis.json`
   (`entries`) en `public/history.json` (`events`) om te bepalen wat nieuw is
   en wat een update van een bestaande entry is. Clusters kandidaten die over
   dezelfde ontwikkeling gaan (meerdere bronnen) samen tot één te schrijven
   entry — dit is het moment om te bepalen welke ontwikkelingen daadwerkelijk
   publicatiewaardig zijn, vóórdat het schrijfwerk wordt verdeeld.

3. **Verdeel het researchen en schrijven over parallelle Agents.** Voor elke
   publicatiewaardige ontwikkeling uit stap 2 (niet elke kandidaat hoeft een
   entry te worden — alleen substantiële ontwikkelingen): spawn één Agent per
   ontwikkeling, allemaal tegelijk in één bericht (niet na elkaar). Batch in
   groepjes van ~6-8 tegelijk als het er veel zijn. Elke agent-prompt moet
   zelfstandig leesbaar zijn en bevatten:
   - de bron-URL('s) en titel(s) uit pretag.json voor die ontwikkeling;
   - de opdracht om de volledige artikeltekst op te halen (WebFetch; bij
     Google News-links die naar consent.google.com redirecten, de
     redirect-URL opnieuw fetchen — lukt dat niet, `curl.exe` met een
     browser-user-agent proberen op het achterliggende medium);
     de category/topics/significance/syndicate-regels uit §3/§5 hieronder;
   - de eis dat `nlSummary`/`enSummary` tot 3 alinea's zijn die de bron
     inhoudelijk weergeven (geen teaser), met staatsbron-caveat waar relevant;
   - de instructie om een compact resultaat terug te geven: voorgestelde
     `title`/`titleNl`, `category`, `topics`, `significance`, `syndicate`,
     `sourceRefs` (itemId/title/url/source) en de twee samenvattingen.

   Beoordeel elk agent-resultaat zelf voordat het de analysis.json in gaat:
   check of de samenvatting klopt met de bron, of category/significance/
   syndicate kloppen volgens de regels hieronder, en herschrijf of verwerp
   waar nodig — de eindverantwoordelijkheid voor kwaliteit blijft bij jou,
   niet bij de agent. Single-source-items (§4) horen in dezelfde agent-ronde
   mee, met de single-source-eisen in de prompt.

   Regels die elke agent moet volgen bij het opstellen van een entry:
   - Eén definitieve `category`: `ttp`, `weapon` of `org`.
   - Gecureerde `topics` (hergebruik de topic-ids uit `pretag.json.topics`).
   - `significance`: 1 (routine) tot 3 (majeure ontwikkeling).
   - `changeFlag`: `"new"` voor een development die nog niet in analysis.json
     stond, `"update"` als een bestaande entry materieel wijzigt (dan
     `sourceRefs` aanvullen, samenvattingen verversen, `updatedAt` bijwerken).
     Laat `changeFlag` weg bij routinematige doorloop zonder wijziging.
   - Meerdere bronnen over dezelfde ontwikkeling → één entry met meerdere
     `sourceRefs`, niet dubbele entries.
   - `syndicate: true` voor ontwikkelingen die relevant zijn voor het bredere
     Adepti-publiek (cross-feed naar adepti-academy.nl, zie §5); anders
     `false`. Vuistregel: significance ≥ 2 én breed begrijpelijk zonder
     RU-mil-vakkennis.

4. **Single-source-stroom apart behandelen** (items met `stream: "single"` uit
   feed/pretag, bijv. Voyennaya Mysl, Krasnaya Zvezda, Defense Express,
   ArmyInform): eigen analysis-entries met `stream: "single"` en `origin`
   (`ru`/`ua`/…). Titel in brontaal + vertaalde titel (`title`/`titleNl`),
   samenvatting die uitlegt wat het artikel inhoudelijk beweert of bespreekt
   (ook tot 3 alinea's), met een vast caveat-zinnetje dat het single source is
   en van welke partij. Nooit vermengen met `stream: "verified"`-entries.

   **Voyennaya Mysl-uitzondering**: dit is een maandblad; de crawler's
   14/30-dagenvenster mist het vaak (nieuwe nummers verschijnen onregelmatig
   en Google News indexeert oudere artikelen door elkaar). Check daarom
   maandelijks handmatig of er een nieuw nummer is verschenen via
   `https://vm.ric.mil.ru/` of een Google News-zoekopdracht op
   `"Военная мысль"`, onafhankelijk van wat er in pretag.json staat.

5. **Cross-feed naar Adepti**: entries met `syndicate: true` verschijnen
   automatisch op adepti-academy.nl via de widget in `Adepti/index.html` (die
   `analysis.json` live cross-origin fetcht). Geen aparte actie nodig — alleen
   zorgvuldig zijn met wat `syndicate: true` krijgt.

6. **Tijdlijn bijwerken**: significance ≥ 2 → toevoegen aan
   `public/history.json` (`events`, append-only, nieuwste eerst). Gebruik
   `titleNl`/`titleEn` en `summaryNl`/`summaryEn` (kort, 1-2 zinnen — dit is
   de tijdlijn-weergave, niet de volledige kaart-samenvatting).

7. **Opschonen**: `analysis.json`-entries ouder dan ~30 dagen (single-stream:
   ~90 dagen) verwijderen — ze blijven bestaan in `history.json`.

8. **Deployen**:
   ```powershell
   pwsh ./deploy.ps1
   git add -A
   git commit -m "Daily analysis: <korte samenvatting>"
   git push
   ```

## Kwaliteitscriteria

- Geen speculatie voorbij wat de bron zegt; onzekerheid benoemen ("volgens
  bron X", "nog niet onafhankelijk bevestigd").
- Eén ontwikkeling = één entry, ook als meerdere bronnen erover schrijven.
- `nlSummary`/`enSummary` zijn onafhankelijke, volwaardige vertalingen van
  elkaar — niet de een een verkorte versie van de ander.
- Bij twijfel over categorie: kies de categorie die het meest centraal staat
  in de kern van het nieuws, niet elke geraakte topic-tag.
