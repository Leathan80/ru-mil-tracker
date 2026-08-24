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
     `sourceRefs` (itemId/title/url/source/**date**), de afgeleide
     `publishedAt` (vroegste sourceRef-datum) en de twee samenvattingen.

   Beoordeel elk agent-resultaat zelf voordat het de analysis.json in gaat:
   check of de samenvatting klopt met de bron, of category/significance/
   syndicate kloppen volgens de regels hieronder, en herschrijf of verwerp
   waar nodig — de eindverantwoordelijkheid voor kwaliteit blijft bij jou,
   niet bij de agent. Single-source-items (§4) horen in dezelfde agent-ronde
   mee, met de single-source-eisen in de prompt.

   Regels die elke agent moet volgen bij het opstellen van een entry:
   - Eén definitieve `category`: `ttp`, `weapon` of `org`.
   - Gecureerde `topics` (hergebruik de topic-ids uit `pretag.json.topics`).
   - Elk object in `sourceRefs` krijgt een `date`-veld: de publicatiedatum/tijd
     (ISO 8601) van dát brondocument. Voor items die uit `pretag.json`/
     `feed.json` komen staat deze datum al op het item (`date`-veld, overnemen
     as-is) — niet zelf hernieuwen. Voor bronnen die de agent los heeft
     opgezocht (bijv. bij het volgen van een verwijzing in de tekst): de
     dateline van het artikel gebruiken, of anders weglaten (geen datum
     verzinnen).
   - `publishedAt` op het entry-niveau: de vroegste `date` uit de
     `sourceRefs`-array van die entry (dus wanneer het onderliggende nieuws
     voor het eerst gemeld werd, niet wanneer de tracker het oppikte). Bij een
     `"update"` van een bestaande entry: `publishedAt` blijft de oorspronkelijke
     vroegste datum, tenzij een nieuw toegevoegde bron een nóg eerdere datum
     heeft.
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
   maandelijks handmatig of er een nieuw nummer is verschenen, onafhankelijk
   van wat er in pretag.json staat.

   `vm.ric.mil.ru` is direct niet bereikbaar (ECONNREFUSED, zowel http als
   https) — dit is een langdurige netwerkblokkade, geen tijdelijke storing:
   ook de Wayback Machine heeft de site sinds maart 2025 niet meer kunnen
   crawlen (laatste snapshot 2025-03-19, te checken via
   `http://web.archive.org/__wb/sparkline?output=json&url=https%3A%2F%2Fvm.ric.mil.ru%2F&collection=web`).
   CyberLeninka en eLibrary.ru indexeren het tijdschrift met jaren vertraging
   (CyberLeninka bleef bij een check in 2026 steken op jaargang 2023) en zijn
   dus ook geen bruikbare live-bron.

   Werkende aanpak: gebruik de Browser-tool (niet WebFetch — die weigert
   web.archive.org en loopt vast op Google's consent-redirect) en zoek via
   Google News RSS naar `"Военная мысль"` (evt. gecombineerd met een
   verwacht onderwerp, bijv. een wapensysteem). VM zelf wordt zelden direct
   geciteerd; nieuwe nummers duiken meestal een paar dagen later op via
   Russische staatsmedia die er losse claims uit overnemen (Life.ru, TASS,
   EADaily, NEWS.ru, Rambler e.d.) — zoek op zinsneden als `"Военная мысль"
   номер` of citaten met een auteursnaam/functie. Navigeer met de Browser
   naar de Google News RSS-link (`https://news.google.com/rss/search?q=...`);
   bij een individueel artikel-item leidt `navigate` naar de item-URL vaak
   via een korte JS-redirect alsnog naar het achterliggende artikel (even
   `wait` en dan `javascript_tool` met `window.location.href` om de
   uiteindelijke URL vast te leggen voor de sourceRef).

   **Milblogger-bronnen** (Rybar, WarGonzo, Fighterbomber, Два майора — via
   `crawler/sources.json`-ids `tg-rybar`/`tg-wargonzo`/`tg-fighterbomber`/
   `tg-dvamajors`, `type: "telegram"`): dit zijn geen officiële staatsbronnen
   maar persoonlijke/redactionele Telegram-kanalen, dus een eigen behandeling:
   - Altijd `stream: "single"`, `origin: "ru"`, plus een extra veld
     `"milblogger": true` op de entry (dit routeert de kaart naar de aparte
     "Milbloggers"-tab op de site, gescheiden van de officiële `pub`-tab).
   - Caveat-zin nog terughoudender dan bij TASS/VM: benoem expliciet dat dit
     een persoonlijke/redactionele stem is, geen MoD-standpunt, en dat
     milbloggers onderling en met het MoD kunnen tegenspreken.
   - Zolang deze bronnen op `enabled: false` staan in `sources.json` komen ze
     niet vanzelf in feed/pretag — pas als ze op `enabled: true` gezet zijn
     (na akkoord) hoort deze stap in de reguliere ronde mee.

5. **Cross-feed naar Adepti**: entries met `syndicate: true` verschijnen
   automatisch op adepti-academy.nl via de widget in `Adepti/current-intel.html`
   (die `analysis.json` live cross-origin fetcht). Geen aparte actie nodig —
   alleen zorgvuldig zijn met wat `syndicate: true` krijgt.

5b. **Cross-check naar de leersites (threat sheets)**. `crawler/crosscheck.js`
   koppelt entries aan de kaart-ids van de zustersites via
   `crawler/cardmap.json` en schrijft `public/crosscheck.json`. De drie sites
   fetchen dat bestand zelf en tonen per kaart een blok "Geanalyseerde
   ontwikkelingen" — dat deel gaat automatisch. Wat *jij* elke run moet doen:

   1. Draai `node crawler/crosscheck.js` (na het schrijven van analysis.json).
   2. Loop de kaarten met `signalCount > 0` door. De signalen (`loss`,
      `variant`, `deploy`, `perf`, `scale`, `counter`) wijzen op een mogelijk
      **verouderde gecureerde kaartwaarde** op de leersite.
   3. Vergelijk zulke entries met de actuele waarde in het bronbestand van die
      site:
      - drone-academy → `drone-academy/js/data-cards.js` (`window.DRONE_CARDS`)
      - AirDefense/VKS → `VKS-leeromgeving/js/data-threats.js`
      - EW Academy → hoofdstukinhoud in `ew-leeromgeving/content/ch*.js`
        (thematisch, geen kaarten)
   4. Als een waarde daadwerkelijk achterhaald lijkt: schrijf een **voorstel**
      in het runrapport — kaart-id, huidige waarde, voorgestelde waarde,
      bronlink en waarom. **Wijzig het lesmateriaal niet zelf.** Zelfde
      afspraak als `threat-review.js` bij het intel-dashboard: gecureerde
      lesinhoud wordt door een mens aangepast, niet automatisch. Leg de
      voorstellen aan de gebruiker voor; pas ze alleen door na expliciete
      goedkeuring.
   5. Nieuw wapensysteem/dronetype gezien dat nog geen kaart-id heeft? Meld dat
      als suggestie (nieuwe kaart + regel in `cardmap.json`) in plaats van het
      stil te laten vallen.

   Let op bij het uitbreiden van `cardmap.json`: gebruik `\b`-woordgrenzen bij
   korte namen (anders matcht bijv. `verba` binnen het Nederlandse "verband") en
   het `require`-veld bij systeemnamen die samenvallen met plaatsnamen
   (Voronezh, Murmansk, Borisoglebsk).

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
   `deploy.ps1` draait `crawler/crosscheck.js` zelf opnieuw vóór de deploy, zodat
   de leersites direct de nieuwste koppelingen zien.

9. **Rapporteer** aan het einde: aantal nieuwe entries, aantal updates, uitkomst
   van de Voyennaya Mysl-check, en — als stap 5b iets opleverde — de
   voorstellenlijst voor de threat sheets (kaart-id, huidige vs. voorgestelde
   waarde, bron). Expliciet melden als er niets voor te stellen valt.

## Kwaliteitscriteria

- Geen speculatie voorbij wat de bron zegt; onzekerheid benoemen ("volgens
  bron X", "nog niet onafhankelijk bevestigd").
- Eén ontwikkeling = één entry, ook als meerdere bronnen erover schrijven.
- `nlSummary`/`enSummary` zijn onafhankelijke, volwaardige vertalingen van
  elkaar — niet de een een verkorte versie van de ander.
- Bij twijfel over categorie: kies de categorie die het meest centraal staat
  in de kern van het nieuws, niet elke geraakte topic-tag.
