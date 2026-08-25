(function () {
  "use strict";

  var el = {
    editionLabel: document.getElementById("editionLabel"),
    editionDate: document.getElementById("editionDate"),
    submast: document.getElementById("submast"),
    mastTitle: document.querySelector(".mast-title"),
    counts: document.getElementById("counts"),
    navSections: document.getElementById("navSections"),
    searchInput: document.getElementById("searchInput"),
    analysisMissingNotice: document.getElementById("analysisMissingNotice"),
    briefView: document.getElementById("briefView"),
    leadArticle: document.getElementById("leadArticle"),
    digestLabel: document.getElementById("digestLabel"),
    digestList: document.getElementById("digestList"),
    topicBlock: document.getElementById("topicBlock"),
    topicsLabel: document.getElementById("topicsLabel"),
    topicChips: document.getElementById("topicChips"),
    impactBlock: document.getElementById("impactBlock"),
    impactLabel: document.getElementById("impactLabel"),
    impactSub: document.getElementById("impactSub"),
    impactList: document.getElementById("impactList"),
    readingNote: document.getElementById("readingNote"),
    timelineView: document.getElementById("timelineView"),
    rawView: document.getElementById("rawView"),
    rawDisclaimer: document.getElementById("rawDisclaimer"),
    rawList: document.getElementById("rawList"),
    installHint: document.getElementById("installHint"),
    installHintText: document.getElementById("installHintText"),
    installHintClose: document.getElementById("installHintClose"),
    footUpdated: document.getElementById("footUpdated"),
  };

  var TABS = ["all", "ttp", "weapon", "org", "pub", "milblog", "timeline", "raw"];
  var TAB_UI_KEY = { all: "tabAll", ttp: "tabTtp", weapon: "tabWeapon", org: "tabOrg", pub: "tabPub", milblog: "tabMilblog", timeline: "tabTimeline", raw: "tabRaw" };
  var DIGEST_MAX = 12;

  var state = {
    lang: "en",
    tab: "all",
    topics: new Set(),
    query: "",
    lead: null,
    feed: null,
    pretag: null,
    analysis: null,
    history: null,
    crosscheck: null,
  };

  function ui(key) {
    var pack = state.lang === "en" ? window.UI_EN : window.UI_NL;
    return pack[key] !== undefined ? pack[key] : key;
  }

  function locale() { return state.lang === "en" ? "en-GB" : "nl-NL"; }

  function fmtTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleString(locale(), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function fmtEditionDate(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d)) d = new Date();
    return d.toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  function fmtDay(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(locale(), { day: "numeric", month: "short" });
  }

  function isRecent(iso, hours) {
    if (!iso) return false;
    var t = Date.parse(iso);
    if (isNaN(t)) return false;
    return (Date.now() - t) <= hours * 3600000;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- data loading ----------

  function fetchJson(path) {
    return fetch(path + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(path + ": HTTP " + r.status); return r.json(); });
  }

  function loadAll() {
    return Promise.allSettled([
      fetchJson("feed.json"),
      fetchJson("pretag.json"),
      fetchJson("analysis.json"),
      fetchJson("history.json"),
      fetchJson("crosscheck.json"),
    ]).then(function (results) {
      state.feed = results[0].status === "fulfilled" ? results[0].value : null;
      state.pretag = results[1].status === "fulfilled" ? results[1].value : null;
      state.analysis = results[2].status === "fulfilled" ? results[2].value : null;
      state.history = results[3].status === "fulfilled" ? results[3].value : null;
      state.crosscheck = results[4].status === "fulfilled" ? results[4].value : null;
    });
  }

  // ---------- entries ----------

  function allEntries() { return (state.analysis && state.analysis.entries) || []; }

  function entriesForTab(tab) {
    var all = allEntries();
    if (tab === "milblog") return all.filter(function (e) { return e.milblogger === true; });
    if (tab === "pub") return all.filter(function (e) { return e.stream === "single" && e.milblogger !== true; });
    var verified = all.filter(function (e) { return e.stream === "verified"; });
    if (tab === "all") return verified;
    return verified.filter(function (e) { return e.category === tab; });
  }

  function topicLabel(id) {
    var t = state.pretag && state.pretag.topics && state.pretag.topics[id];
    if (t) return state.lang === "en" ? t.en : t.nl;
    return id;
  }

  function entryTitle(e) {
    return state.lang === "en" ? e.title : (e.titleNl || e.title);
  }

  function entrySummary(e) {
    return (state.lang === "en" ? e.enSummary : e.nlSummary) || "";
  }

  function matchesQuery(e, q) {
    if (!q) return true;
    var hay = [e.title, e.titleNl, entrySummary(e)]
      .concat((e.topics || []).map(topicLabel))
      .concat((e.sourceRefs || []).map(function (s) { return s.source + " " + s.title; }))
      .join(" ")
      .toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function visibleEntries() {
    var q = state.query.trim().toLowerCase();
    return entriesForTab(state.tab)
      .filter(function (e) {
        if (state.topics.size && !(e.topics || []).some(function (t) { return state.topics.has(t); })) return false;
        return matchesQuery(e, q);
      })
      .sort(function (a, b) {
        var d = (b.updatedAt || "").localeCompare(a.updatedAt || "");
        return d !== 0 ? d : (b.significance || 0) - (a.significance || 0);
      });
  }

  function leadEntry(list) {
    if (!list.length) return null;
    var found = state.lead && list.filter(function (e) { return e.id === state.lead; })[0];
    return found || list[0];
  }

  // ---------- chrome ----------

  function renderChrome() {
    document.documentElement.lang = state.lang;
    document.title = ui("brand");

    el.editionLabel.textContent = ui("edition");
    el.editionDate.textContent = fmtEditionDate(state.analysis && state.analysis.updated);
    el.submast.textContent = ui("tagline");

    var all = allEntries();
    var verified = all.filter(function (e) { return e.stream === "verified"; }).length;
    var single = all.filter(function (e) { return e.stream === "single"; }).length;
    var countsText = verified + " " + ui("verifiedWord") + " · " + single + " " + ui("singleWord");
    el.counts.textContent = countsText;
    if (el.mastTitle) el.mastTitle.setAttribute("data-counts", countsText);

    el.searchInput.placeholder = ui("search");
    el.digestLabel.textContent = ui("digest");
    el.topicsLabel.textContent = ui("topicsLabel");
    el.impactLabel.textContent = ui("impactTitle");
    el.impactSub.textContent = ui("impactSub");
    el.rawDisclaimer.textContent = ui("rawFeedDisclaimer");
    el.installHintText.textContent = ui("installHint");

    el.footUpdated.textContent = ui("updatedLabel") + " " + (state.analysis ? fmtTime(state.analysis.updated) : "—") +
      "  ·  " + ui("feedUpdatedLabel") + " " + (state.feed ? fmtTime(state.feed.updated) : "—");

    document.querySelectorAll(".lang-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === state.lang);
    });

    el.navSections.innerHTML = "";
    TABS.forEach(function (tab) {
      var b = document.createElement("button");
      b.className = "nav-btn" + (state.tab === tab ? " active" : "");
      b.setAttribute("data-tab", tab);
      b.textContent = ui(TAB_UI_KEY[tab]);
      el.navSections.appendChild(b);
    });

    if (!state.analysis) {
      el.analysisMissingNotice.textContent = ui("analysisMissing");
      el.analysisMissingNotice.classList.remove("hidden");
    } else {
      el.analysisMissingNotice.classList.add("hidden");
    }
  }

  // ---------- lead ----------

  function sigHtml(n, category) {
    var out = '<span class="sig" style="color: var(--' + (category || "accent") + ')">';
    for (var i = 1; i <= 3; i++) out += '<i class="' + (i <= n ? "on" : "") + '"></i>';
    return out + "</span>";
  }

  function flagFor(e) {
    if (e.milblogger) return ui("badgeMilblog");
    if (e.stream === "single") return ui("badgeSingle");
    if (e.state) return ui("badgeState");
    if (e.changeFlag && isRecent(e.updatedAt, 48)) return e.changeFlag === "new" ? ui("badgeNew") : ui("badgeUpdated");
    return "";
  }

  function renderLead(e) {
    if (!e) {
      el.leadArticle.innerHTML = '<p class="empty-state">' + esc(state.query ? ui("searchEmpty") : ui("emptyState")) + "</p>";
      return;
    }

    var paras = entrySummary(e).split(/\n\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
    var flag = flagFor(e);
    var origin = e.stream === "single" && e.origin ? (ui("origin")[e.origin] || e.origin.toUpperCase()) : "";

    var sources = (e.sourceRefs || []).map(function (s) {
      return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.source) + "</a>";
    }).join('<span aria-hidden="true">·</span>');

    el.leadArticle.innerHTML =
      '<div class="lead-kicker">' +
        '<span class="cat-chip ' + esc(e.category) + '">' + esc(ui("categoryLabel")[e.category] || e.category) + "</span>" +
        '<span class="kicker-item">' + esc(ui("significance")) + " " + sigHtml(e.significance || 0, e.category) + "</span>" +
        (flag ? '<span class="flag-chip">' + esc(flag) + "</span>" : "") +
        (origin ? '<span class="flag-chip">' + esc(origin) + "</span>" : "") +
      "</div>" +
      "<h2>" + esc(entryTitle(e)) + "</h2>" +
      '<div class="lead-body">' + paras.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
      '<div class="lead-meta">' +
        '<span class="date">' + esc(fmtDay(e.updatedAt || e.publishedAt)) + "</span>" +
        '<span class="lead-sources">' + sources + "</span>" +
      "</div>";
  }

  function renderDigest(list, lead) {
    el.digestList.innerHTML = "";
    var rest = list.filter(function (e) { return !lead || e.id !== lead.id; }).slice(0, DIGEST_MAX);
    // Bij precies één resultaat heeft een kop "Ook vandaag" zonder items geen zin:
    // dan verdwijnt de hele sectie in plaats van een lege lijst te tonen.
    var section = el.digestList.closest(".digest");
    if (section) section.classList.toggle("hidden", !rest.length);
    if (!rest.length) return;
    rest.forEach(function (e) {
      var b = document.createElement("button");
      b.className = "digest-item " + e.category;
      b.setAttribute("data-id", e.id);
      b.innerHTML =
        '<span class="d-title">' + esc(entryTitle(e)) + "</span>" +
        '<span class="d-meta">' + esc(fmtDay(e.updatedAt || e.publishedAt)) +
          (e.topics && e.topics.length ? " · " + esc(e.topics.slice(0, 2).map(topicLabel).join(", ")) : "") +
        "</span>";
      el.digestList.appendChild(b);
    });
  }

  // ---------- margin column ----------

  function renderTopicChips(scope) {
    var ids = [];
    scope.forEach(function (e) {
      (e.topics || []).forEach(function (t) { if (ids.indexOf(t) < 0) ids.push(t); });
    });
    ids.sort(function (a, b) { return topicLabel(a).localeCompare(topicLabel(b)); });

    el.topicChips.innerHTML = "";
    el.topicBlock.classList.toggle("hidden", !ids.length);
    ids.forEach(function (id) {
      var chip = document.createElement("button");
      chip.className = "chip" + (state.topics.has(id) ? " active" : "");
      chip.textContent = topicLabel(id);
      chip.addEventListener("click", function () {
        if (state.topics.has(id)) state.topics.delete(id); else state.topics.add(id);
        state.lead = null;
        render();
      });
      el.topicChips.appendChild(chip);
    });
  }

  // Bouwt eenmalig een index entry-id -> gecureerde kaarten op de zustersites.
  var impactIndex = null;
  function buildImpactIndex() {
    impactIndex = {};
    var sites = (state.crosscheck && state.crosscheck.sites) || {};
    Object.keys(sites).forEach(function (siteKey) {
      var site = sites[siteKey];
      var cards = site.cards || {};
      Object.keys(cards).forEach(function (cardId) {
        var card = cards[cardId];
        (card.entries || []).forEach(function (ce) {
          (impactIndex[ce.id] = impactIndex[ce.id] || []).push({
            site: site.name,
            url: site.url,
            card: card,
            signals: ce.signals || [],
          });
        });
      });
    });
  }

  function renderImpact(e) {
    if (!impactIndex) buildImpactIndex();
    var hits = (e && impactIndex[e.id]) || [];
    el.impactList.innerHTML = "";
    if (!hits.length) {
      el.impactList.innerHTML = '<p class="margin-sub">' + esc(ui("impactEmpty")) + "</p>";
      return;
    }
    hits.slice(0, 4).forEach(function (h) {
      var name = state.lang === "en" ? (h.card.nameEn || h.card.name) : h.card.name;
      var signals = h.signals.slice(0, 3).map(function (s) {
        return '<span class="signal">' + esc(ui("signalLabel")[s] || s) + "</span>";
      }).join("");
      var div = document.createElement("div");
      div.className = "impact-card";
      div.innerHTML =
        '<div class="impact-head"><span class="name">' + esc(name) + "</span>" +
          '<span class="hits">' + esc(h.card.total || "") + "</span></div>" +
        '<a class="impact-site" href="' + esc(h.url) + '" target="_blank" rel="noopener">' + esc(h.site) + "</a>" +
        (signals ? '<div class="signal-row">' + signals + "</div>" : "");
      el.impactList.appendChild(div);
    });
  }

  function renderReadingNote(e) {
    var title = ui("noteVerifiedT");
    var body = ui("noteVerifiedB");
    if (e && e.milblogger) { title = ui("noteMilblogT"); body = ui("noteMilblogB"); }
    else if (e && e.stream === "single") { title = ui("noteSingleT"); body = ui("noteSingleB"); }
    el.readingNote.innerHTML = "<h3>" + esc(title) + "</h3><p>" + esc(body) + "</p>";
  }

  // ---------- timeline ----------

  function renderTimeline() {
    el.timelineView.innerHTML = "";
    var events = (state.history && state.history.events) || [];
    var q = state.query.trim().toLowerCase();
    var filtered = events.filter(function (ev) {
      if (state.topics.size && !(ev.topics || []).some(function (t) { return state.topics.has(t); })) return false;
      if (!q) return true;
      var hay = [ev.titleEn, ev.titleNl, ev.summaryEn, ev.summaryNl].join(" ").toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    if (!filtered.length) {
      el.timelineView.innerHTML = '<p class="empty-state">' + esc(ui("timelineEmpty")) + "</p>";
      return;
    }
    var byDate = {};
    filtered.forEach(function (ev) { (byDate[ev.date] = byDate[ev.date] || []).push(ev); });
    Object.keys(byDate).sort().reverse().forEach(function (date) {
      var day = document.createElement("div");
      day.className = "timeline-day";
      var evHtml = byDate[date].map(function (ev) {
        var title = state.lang === "en" ? ev.titleEn : ev.titleNl;
        var summary = state.lang === "en" ? ev.summaryEn : ev.summaryNl;
        return '<div class="timeline-event ' + esc(ev.category) + '">' +
          '<div class="t-title">' + esc(title) + "</div>" +
          '<div class="t-summary">' + esc(summary) + "</div>" +
        "</div>";
      }).join("");
      day.innerHTML = '<div class="timeline-date">' + esc(date) + '</div><div class="timeline-events">' + evHtml + "</div>";
      el.timelineView.appendChild(day);
    });
  }

  // ---------- raw feed ----------

  function pretagFor(itemId) {
    if (!state.pretag) return null;
    return (state.pretag.candidates || []).find(function (c) { return c.id === itemId; }) || null;
  }

  function renderRawFeed() {
    var q = state.query.trim().toLowerCase();
    var items = ((state.feed && state.feed.items) || []).filter(function (it) {
      if (!q) return true;
      return (it.title + " " + (it.sourceName || it.source || "")).toLowerCase().indexOf(q) >= 0;
    }).slice(0, 60);

    el.rawList.innerHTML = "";
    items.forEach(function (it) {
      var pt = pretagFor(it.id);
      var chips = pt ? pt.categories.concat(pt.topics).map(function (c) {
        return '<span class="pretag-chip">' + esc(c) + "</span>";
      }).join("") : "";
      var div = document.createElement("div");
      div.className = "raw-item";
      div.innerHTML =
        '<a href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.title) + "</a>" +
        '<span class="raw-source">' + esc(it.sourceName || it.source) + "</span>" + chips;
      el.rawList.appendChild(div);
    });
  }

  // ---------- install hint ----------

  function standalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function renderInstallHint() {
    var dismissed = false;
    try { dismissed = localStorage.getItem("rumil_hint") === "off"; } catch (e) {}
    var small = window.matchMedia("(max-width: 760px)").matches;
    var show = !dismissed && !standalone() && small;
    el.installHint.classList.toggle("hidden", !show);
    document.body.classList.toggle("has-hint", show);
  }

  // ---------- main render ----------

  function render() {
    renderChrome();

    var isTimeline = state.tab === "timeline";
    var isRaw = state.tab === "raw";
    el.briefView.classList.toggle("hidden", isTimeline || isRaw);
    el.timelineView.classList.toggle("hidden", !isTimeline);
    el.rawView.classList.toggle("hidden", !isRaw);

    if (isTimeline) { renderTimeline(); return; }
    if (isRaw) { renderRawFeed(); return; }

    var list = visibleEntries();
    var lead = leadEntry(list);
    renderTopicChips(entriesForTab(state.tab));
    renderLead(lead);
    renderDigest(list, lead);
    renderImpact(lead);
    renderReadingNote(lead);
  }

  // ---------- events ----------

  document.querySelectorAll(".lang-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      state.lang = b.getAttribute("data-lang");
      try { localStorage.setItem("rumil_lang", state.lang); } catch (e) {}
      render();
    });
  });

  el.navSections.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".nav-btn");
    if (!btn) return;
    state.tab = btn.getAttribute("data-tab");
    state.topics.clear();
    state.lead = null;
    render();
  });

  el.digestList.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".digest-item");
    if (!btn) return;
    state.lead = btn.getAttribute("data-id");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  var searchTimer = null;
  el.searchInput.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.query = el.searchInput.value;
      state.lead = null;
      render();
    }, 150);
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "/" || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var t = ev.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    ev.preventDefault();
    el.searchInput.focus();
  });

  el.installHintClose.addEventListener("click", function () {
    try { localStorage.setItem("rumil_hint", "off"); } catch (e) {}
    el.installHint.classList.add("hidden");
    document.body.classList.remove("has-hint");
  });

  window.addEventListener("resize", renderInstallHint);

  // ---------- init ----------

  try {
    var saved = localStorage.getItem("rumil_lang");
    if (saved === "nl" || saved === "en") state.lang = saved;
  } catch (e) {}

  loadAll().then(function () {
    render();
    renderInstallHint();
  }).catch(function (e) {
    console.error(e);
    render();
  });

  // Service worker: offline lezen van de laatst opgehaalde briefing, en de
  // installatieprompt van Chrome op Android.
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (err) {
        console.warn("service worker registration failed", err);
      });
    });
  }
})();
