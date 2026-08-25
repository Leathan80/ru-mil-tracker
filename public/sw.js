/* Service worker voor de Russian Military Tracker.
 *
 * Twee strategieën, bewust gescheiden:
 *   - app-shell (html/css/js/iconen): stale-while-revalidate. De cache antwoordt direct,
 *     maar op de achtergrond wordt altijd de netwerkversie opgehaald en weggeschreven,
 *     zodat een deploy uiterlijk bij de volgende lading doorkomt. Cache-first zonder
 *     revalidatie zou bezoekers na een deploy op de oude CSS/JS laten hangen tot de
 *     VERSION verandert — precies de bug die dit ooit veroorzaakte.
 *   - databestanden (feed/pretag/analysis/history/crosscheck): network-first met de cache
 *     als terugval, zodat je nooit een verouderde briefing te zien krijgt zolang je online
 *     bent, maar offline wél de laatst opgehaalde versie kunt lezen.
 *
 * De app haalt data op met een cache-buster (?t=...). Die query strippen we voordat we
 * cachen, anders groeit de cache eindeloos en vindt de terugval niets.
 *
 * VERSION bumpen mag, maar is niet meer nodig om een deploy door te laten komen; het
 * dwingt alleen een schone cache af.
 */

var VERSION = "rumil-2026-08-25c";
var SHELL_CACHE = VERSION + "-shell";
var DATA_CACHE = VERSION + "-data";

var SHELL = [
  "./",
  "index.html",
  "css/style.css",
  "js/app.js",
  "js/i18n.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
  "icons/apple-touch-icon-180.png",
];

var DATA_FILES = ["feed.json", "pretag.json", "analysis.json", "history.json", "crosscheck.json"];

function isDataRequest(url) {
  var name = url.pathname.split("/").pop();
  return DATA_FILES.indexOf(name) >= 0;
}

function offlineResponse() {
  return new Response("", { status: 504, statusText: "Offline en niet in cache" });
}

function cacheKey(url) {
  return url.origin + url.pathname; // query (?t=...) eraf
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k !== SHELL_CACHE && k !== DATA_CACHE) return caches.delete(k);
          return null;
        }));
      })
      .then(function () { return caches.open(SHELL_CACHE); })
      .then(function (cache) {
        // Zelfherstel: Android kan cache-opslag opruimen. Haal alles wat ontbreekt
        // opnieuw op, zodat de shell nooit half in de cache staat.
        return Promise.all(SHELL.map(function (path) {
          return cache.match(path).then(function (hit) {
            return hit ? null : cache.add(path).catch(function () { return null; });
          });
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // fonts e.d. laten we met rust

  if (isDataRequest(url)) {
    event.respondWith(
      fetch(req)
        .then(function (resp) {
          if (resp && resp.ok) {
            var copy = resp.clone();
            caches.open(DATA_CACHE).then(function (c) { c.put(cacheKey(url), copy); });
          }
          return resp;
        })
        .catch(function () {
          return caches.open(DATA_CACHE).then(function (c) { return c.match(cacheKey(url)); })
            .then(function (hit) { return hit || offlineResponse(); });
        })
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(function () {
        return caches.match("index.html", { cacheName: SHELL_CACHE }).then(function (hit) {
          return hit || offlineResponse();
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.open(SHELL_CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        var fromNetwork = fetch(req).then(function (resp) {
          if (resp && resp.ok && resp.type === "basic") cache.put(req, resp.clone());
          return resp;
        }).catch(function () { return hit || null; });
        // Cache antwoordt direct, netwerk ververst op de achtergrond. Zonder treffer
        // wachten we op het netwerk — en geven we altijd een échte Response terug:
        // respondWith(undefined) laat het subresource hard falen, waardoor de pagina
        // zonder CSS en JS overblijft.
        return hit || fromNetwork.then(function (resp) { return resp || offlineResponse(); });
      });
    })
  );
});
