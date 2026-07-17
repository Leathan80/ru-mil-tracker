# Veilige handmatige deploy voor RU Military Tracker.
#
# feed.json en pretag.json zijn EIGENDOM van de cloud-crawler (GitHub Actions, elke
# ~4 uur). Een lokale `firebase deploy` uploadt de hele public/-map en zou een
# verouderde lokale kopie over de verse cloud-versie heen zetten. Daarom halen we
# hier eerst de actuele bestanden van de live site op vóór we deployen.
#
# analysis.json en history.json zijn EIGENDOM van de lokale dagelijkse analysetaak
# — die blijven dus lokaal (niet ophalen), zodat een verse analyse niet wordt
# teruggedraaid.
#
# Gebruik: pwsh ./deploy.ps1   (vanuit de projectmap)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Actuele feed.json/pretag.json van de site halen (crawler-eigendom)..."
curl.exe -s "https://ru-mil-tracker.web.app/feed.json" -o "public/feed.json"
curl.exe -s "https://ru-mil-tracker.web.app/pretag.json" -o "public/pretag.json"

Write-Host "Deployen naar Firebase Hosting..."
firebase deploy --only hosting
