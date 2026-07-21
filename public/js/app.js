(function () {
  "use strict";

  var el = {
    brandText: document.getElementById("brandText"),
    tagline: document.getElementById("tagline"),
    analysisUpdated: document.getElementById("analysisUpdated"),
    feedUpdated: document.getElementById("feedUpdated"),
    tabbar: document.getElementById("tabbar"),
    analysisMissingNotice: document.getElementById("analysisMissingNotice"),
    topicChips: document.getElementById("topicChips"),
    pubDisclaimer: document.getElementById("pubDisclaimer"),
    cardList: document.getElementById("cardList"),
    timelineView: document.getElementById("timelineView"),
    rawToggle: document.getElementById("rawToggle"),
    rawContent: document.getElementById("rawContent"),
    rawDisclaimer: document.getElementById("rawDisclaimer"),
    rawList: document.getElementById("rawList"),
  };

  var TABS = ["all", "ttp", "weapon", "org", "pub", "timeline"];
  var TAB_UI_KEY = { all: "tabAll", ttp: "tabTtp", weapon: "tabWeapon", org: "tabOrg", pub: "tabPub", timeline: "tabTimeline" };

  var state = {
    lang: "en",
    tab: "all",
    topics: new Set(),
    feed: null,
    pretag: null,
    analysis: null,
    history: null,
  };

  function ui(key) {
    var pack = state.lang === "en" ? window.UI_EN : window.UI_NL;
    return pack[key] !== undefined ? pack[key] : key;
  }

  function fmtTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleString(state.lang === "en" ? "en-GB" : "nl-NL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
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
    ]).then(function (results) {
      state.feed = results[0].status === "fulfilled" ? results[0].value : null;
      state.pretag = results[1].status === "fulfilled" ? results[1].value : null;
      state.analysis = results[2].status === "fulfilled" ? results[2].value : null;
      state.history = results[3].status === "fulfilled" ? results[3].value : null;
    });
  }

  // ---------- rendering: chrome ----------

  function renderChrome() {
    document.documentElement.lang = state.lang;
    el.tagline.textContent = ui("tagline");
    el.analysisUpdated.textContent = ui("updatedLabel") + ": " + (state.analysis ? fmtTime(state.analysis.updated) : "—");
    el.feedUpdated.textContent = ui("feedUpdatedLabel") + ": " + (state.feed ? fmtTime(state.feed.updated) : "—");
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === state.lang);
    });
    document.querySelectorAll(".tab-btn").forEach(function (b) {
      b.textContent = ui(TAB_UI_KEY[b.getAttribute("data-tab")]);
      b.classList.toggle("active", b.getAttribute("data-tab") === state.tab);
    });
    el.rawDisclaimer.textContent = ui("rawFeedDisclaimer");
    el.rawToggle.textContent = ui(el.rawContent.classList.contains("hidden") ? "rawFeedToggleShow" : "rawFeedToggleHide");
    el.pubDisclaimer.textContent = ui("pubDisclaimer");

    if (!state.analysis) {
      el.analysisMissingNotice.textContent = ui("analysisMissing");
      el.analysisMissingNotice.classList.remove("hidden");
    } else {
      el.analysisMissingNotice.classList.add("hidden");
    }
  }

  // ---------- topic chips ----------

  function allTopicsInScope(entries) {
    var ids = new Set();
    entries.forEach(function (e) { (e.topics || []).forEach(function (t) { ids.add(t); }); });
    return Array.from(ids);
  }

  function topicLabel(id) {
    var t = state.pretag && state.pretag.topics && state.pretag.topics[id];
    if (t) return state.lang === "en" ? t.en : t.nl;
    return id;
  }

  function renderTopicChips(entries) {
    if (state.tab === "timeline") { el.topicChips.innerHTML = ""; return; }
    var ids = allTopicsInScope(entries).sort();
    el.topicChips.innerHTML = "";
    ids.forEach(function (id) {
      var chip = document.createElement("button");
      chip.className = "chip" + (state.topics.has(id) ? " active" : "");
      chip.textContent = topicLabel(id);
      chip.addEventListener("click", function () {
        if (state.topics.has(id)) state.topics.delete(id); else state.topics.add(id);
        render();
      });
      el.topicChips.appendChild(chip);
    });
  }

  // ---------- entries / filtering ----------

  function entriesForTab(tab) {
    var all = (state.analysis && state.analysis.entries) || [];
    if (tab === "pub") return all.filter(function (e) { return e.stream === "single"; });
    var verified = all.filter(function (e) { return e.stream === "verified"; });
    if (tab === "all") return verified;
    return verified.filter(function (e) { return e.category === tab; });
  }

  function applyTopicFilter(entries) {
    if (!state.topics.size) return entries;
    return entries.filter(function (e) {
      return (e.topics || []).some(function (t) { return state.topics.has(t); });
    });
  }

  // ---------- card rendering ----------

  function splitParagraphs(text) {
    return String(text || "").split(/\n\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
  }

  function sigPips(n) {
    var out = "";
    for (var i = 1; i <= 3; i++) out += '<span class="pip' + (i <= n ? "" : " off") + '">●</span>';
    return out;
  }

  function renderCard(e) {
    var summary = state.lang === "en" ? e.enSummary : e.nlSummary;
    var paras = splitParagraphs(summary);
    var title = state.lang === "en" ? e.title : (e.titleNl || e.title);
    var badges = [];
    badges.push('<span class="badge badge-cat cat-' + e.category + '">' + esc(ui("categoryLabel")[e.category] || e.category) + '</span>');
    if (e.state) badges.push('<span class="badge badge-state">' + esc(ui("badgeState")) + '</span>');
    if (e.stream === "single") {
      badges.push('<span class="badge badge-single">' + esc(ui("badgeSingle")) + '</span>');
      if (e.origin) badges.push('<span class="badge badge-origin">' + esc(ui("origin")[e.origin] || e.origin.toUpperCase()) + '</span>');
    }
    if (e.changeFlag && isRecent(e.updatedAt, 48)) {
      badges.push('<span class="badge ' + (e.changeFlag === "new" ? "badge-new" : "badge-updated") + '">' +
        esc(ui(e.changeFlag === "new" ? "badgeNew" : "badgeUpdated")) + '</span>');
    }

    var topicsHtml = (e.topics || []).map(function (t) {
      return '<span class="topic-tag">' + esc(topicLabel(t)) + '</span>';
    }).join("");

    var summaryHtml = paras.map(function (p, i) {
      return '<p class="' + (i === 0 ? "first" : "extra") + '">' + esc(p) + '</p>';
    }).join("");

    var sourcesHtml = (e.sourceRefs || []).map(function (s) {
      return '<div><span class="src-name">' + esc(s.source) + '</span><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a></div>';
    }).join("");

    var card = document.createElement("article");
    card.className = "card cat-" + e.category;
    card.innerHTML =
      '<div class="card-head">' +
        '<h3 class="card-title">' + esc(title) + '</h3>' +
        '<div class="card-badges">' + badges.join("") + '</div>' +
      '</div>' +
      '<div class="card-topics">' + topicsHtml + '</div>' +
      '<div class="card-sig">' + ui("significance") + ': ' + sigPips(e.significance || 0) + '</div>' +
      '<div class="card-summary">' + summaryHtml + '</div>' +
      (paras.length > 1 ? '<button class="card-toggle">' + esc(ui("readMore")) + '</button>' : "") +
      '<div class="card-sources"><strong>' + esc(ui("sources")) + ':</strong>' + sourcesHtml + '</div>';

    var toggle = card.querySelector(".card-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var expanded = card.classList.toggle("expanded");
        toggle.textContent = expanded ? ui("readLess") : ui("readMore");
      });
    }
    return card;
  }

  function renderCards(entries) {
    el.cardList.innerHTML = "";
    if (!entries.length) {
      el.cardList.innerHTML = '<div class="empty-state">' + esc(ui("emptyState")) + '</div>';
      return;
    }
    entries
      .slice()
      .sort(function (a, b) { return (b.updatedAt || "").localeCompare(a.updatedAt || ""); })
      .forEach(function (e) { el.cardList.appendChild(renderCard(e)); });
  }

  // ---------- timeline ----------

  function renderTimeline() {
    el.timelineView.innerHTML = "";
    var events = (state.history && state.history.events) || [];
    var filtered = state.topics.size
      ? events.filter(function (ev) { return (ev.topics || []).some(function (t) { return state.topics.has(t); }); })
      : events;
    if (!filtered.length) {
      el.timelineView.innerHTML = '<div class="empty-state">' + esc(ui("timelineEmpty")) + '</div>';
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
        return '<div class="timeline-event cat-' + ev.category + '">' +
          '<div class="t-title">' + esc(title) + '</div>' +
          '<div class="t-summary">' + esc(summary) + '</div>' +
        '</div>';
      }).join("");
      day.innerHTML = '<div class="timeline-date">' + esc(date) + '</div><div class="timeline-events">' + evHtml + '</div>';
      el.timelineView.appendChild(day);
    });
  }

  // ---------- raw feed panel ----------

  function pretagFor(itemId) {
    if (!state.pretag) return null;
    return (state.pretag.candidates || []).find(function (c) { return c.id === itemId; }) || null;
  }

  function renderRawFeed() {
    var items = ((state.feed && state.feed.items) || []).slice(0, 50);
    el.rawList.innerHTML = "";
    items.forEach(function (it) {
      var pt = pretagFor(it.id);
      var chips = pt ? pt.categories.concat(pt.topics).map(function (c) {
        return '<span class="pretag-chip">' + esc(c) + '</span>';
      }).join("") : "";
      var div = document.createElement("div");
      div.className = "raw-item";
      div.innerHTML =
        '<a href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.title) + '</a>' +
        '<span class="raw-source">' + esc(it.sourceName || it.source) + '</span>' +
        chips;
      el.rawList.appendChild(div);
    });
  }

  // ---------- main render ----------

  function render() {
    renderChrome();

    var isTimeline = state.tab === "timeline";
    el.timelineView.classList.toggle("hidden", !isTimeline);
    el.cardList.classList.toggle("hidden", isTimeline);
    el.pubDisclaimer.classList.toggle("hidden", state.tab !== "pub");

    if (isTimeline) {
      el.topicChips.innerHTML = "";
      renderTimeline();
      return;
    }

    var entries = entriesForTab(state.tab);
    renderTopicChips(entries);
    renderCards(applyTopicFilter(entries));
  }

  // ---------- events ----------

  document.querySelectorAll(".lang-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      state.lang = b.getAttribute("data-lang");
      try { localStorage.setItem("rumil_lang", state.lang); } catch (e) {}
      render();
    });
  });

  el.tabbar.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".tab-btn");
    if (!btn) return;
    state.tab = btn.getAttribute("data-tab");
    state.topics.clear();
    render();
  });

  el.rawToggle.addEventListener("click", function () {
    var hidden = el.rawContent.classList.toggle("hidden");
    el.rawToggle.textContent = ui(hidden ? "rawFeedToggleShow" : "rawFeedToggleHide");
    if (!hidden) renderRawFeed();
  });

  // ---------- init ----------

  try {
    var saved = localStorage.getItem("rumil_lang");
    if (saved === "nl" || saved === "en") state.lang = saved;
  } catch (e) {}

  loadAll().then(render).catch(function (e) {
    console.error(e);
    render();
  });
})();
