# RU Military Tracker

Tweetalige (NL/EN) OSINT-tracker voor Russische militaire ontwikkelingen in drie
categorieën — **TTP's**, **Wapensystemen** en **Organisatie** — plus een aparte
**Publicaties**-stroom met single-source bronnen van alle nationaliteiten
(o.a. *Voyennaya Mysl*, *Krasnaya Zvezda*, Defense Express, ArmyInform).

Live: https://ru-mil-tracker.web.app

## Architectuur

```
cron-job.org (elke 4u) ──► GitHub Actions (feed.yml)
                              │  node crawler/crawl.js   → public/feed.json
                              │  node crawler/pretag.js  → public/pretag.json
                              └─ deploy → Firebase Hosting
Dagelijkse lokale Claude-taak ─► analyseert pretag-kandidaten
                              │  schrijft analysis.json + history.json
                              └─ deploy.ps1 → Firebase Hosting
```

Statische site zonder buildstep; alle data als platte JSON op Firebase Hosting.
Geen database, geen npm-dependencies.

## Eigendomsregels (belangrijk!)

| Bestand | Eigenaar | Cadans |
|---|---|---|
| `public/feed.json`, `public/pretag.json` | Cloud-crawler (GitHub Actions) | elke ~4 uur |
| `public/analysis.json`, `public/history.json` | Dagelijkse lokale Claude-analysetaak | dagelijks ~07:00 |

Beide kanten halen éérst de bestanden van de ander van de live site op vóór ze
deployen (sync-stap in `feed.yml`, curl-stap in `deploy.ps1`). Nooit handmatig
`firebase deploy` draaien zonder eerst `deploy.ps1` te gebruiken.

## Bronstromen

- **verified** — multi-source OSINT-bronnen (ISW, Oryx, Militarnyi, …). Voedt de
  tabbladen Alles / TTP's / Wapensystemen / Organisatie.
- **single** — single-source publicaties van alle nationaliteiten (Russische
  vakbladen, Oekraïense platforms, staatspersdiensten). Voedt uitsluitend het
  tabblad Publicaties, expliciet gelabeld met SINGLE SOURCE- en herkomst-badges.

Bron toevoegen = één regel in `crawler/sources.json`. Velden:
`stream` (verified|single), `origin` (ru/ua/…), `state` (staatsbron-badge),
`relevance` ("always" = hele feed relevant, "filter" = alleen items die de
Russia-regex in crawl.js raken), `categoryHints`, `maxNew`, `enabled`, `verify`.

Bron zonder RSS? Gebruik een Google News site-query als `feedUrl`
(`https://news.google.com/rss/search?q=site:example.com`) — de crawler merkt
geen verschil.

## Eenmalige setup (afgerond)

1. ✅ Firebase-project `ru-mil-tracker` + hosting (`firebase deploy --only hosting`).
2. ✅ Service-account `github-action-1304190100` (rol Firebase Hosting Admin) →
   GitHub repo-secret `FIREBASE_SERVICE_ACCOUNT_RU_MIL_TRACKER` (aangemaakt via
   `firebase init hosting:github`).
3. ✅ Repo `Leathan80/ru-mil-tracker` (public i.v.m. gratis Actions-minuten).
4. ⏳ cron-job.org: POST naar
   `https://api.github.com/repos/Leathan80/ru-mil-tracker/actions/workflows/feed.yml/dispatches`
   met body `{"ref":"master"}` en een PAT met workflow-scope, elke 4 uur.
5. ⏳ Dagelijkse Claude-taak registreren; procedure: `analysis/daily-analysis-prompt.md`.

## Lokaal draaien

```powershell
node crawler/crawl.js     # ververst public/feed.json
node crawler/pretag.js    # ververst public/pretag.json
# preview: launch-config "ru-mil-tracker" (http-server, poort 5611)
pwsh ./deploy.ps1         # veilige deploy (pull crawler-JSON eerst)
```

## Cross-feed

`analysis.json` en `feed.json` hebben `Access-Control-Allow-Origin: *`.
adepti-academy.nl toont entries met `syndicate: true` (of `significance >= 2`)
via een fetch-widget — zelfde patroon als de VKS-site met threat-feed.json.
