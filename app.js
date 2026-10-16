/* Locktober: nav, saved goals, daily check-in, and the small interactive panels.
   Everything is saved in this browser only (localStorage). */
(function () {
  "use strict";

  // ---------- nav ----------
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // ---------- dates ----------
  var now = new Date();
  // Locktober year: this October, or last October if we're before October.
  var YEAR = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  var DAYS = 31;
  function todayIndex() {
    if (now.getFullYear() > YEAR || now.getMonth() > 9) return DAYS;
    if (now.getMonth() < 9) return 1;
    return now.getDate();
  }
  var TODAY = todayIndex();
  function key(day) { return YEAR + "-10-" + (day < 10 ? "0" : "") + day; }
  function dateOf(day) { return new Date(YEAR, 9, day); }

  // Spiritual Workout Plan, Fall 2026: October daily readings (Mon–Fri) and memory verses.
  var READINGS = {
    "2026-09-28": { mem: "Galatians 1:8", nt1: ["1 Tim 6", "2 Tim 1", "2 Tim 2", "2 Tim 3", "2 Tim 4"], nt4: ["Luke 10–12", "Luke 13–15", "Luke 16–18", "Luke 19–21", "Luke 22–24"], ot: ["Jonah 1:1–9", "Jonah 1:10–17", "Jonah 2", "Jonah 3", "Jonah 4"] },
    "2026-10-05": { mem: "Galatians 3:2b", nt1: ["Titus 1", "Titus 2", "Titus 3", "Philemon 1", "Hebrews 1"], nt4: ["John 1–5", "John 6–9", "John 10–13", "John 14–17", "John 18–21"], ot: ["Micah 1–2", "Micah 3–4", "Micah 5", "Micah 6", "Micah 7"] },
    "2026-10-12": { mem: "Galatians 3:13", nt1: ["Hebrews 2", "Hebrews 3", "Hebrews 4", "Hebrews 5", "Hebrews 6"], nt4: ["Acts 1–3", "Acts 4–6", "Acts 7–8", "Acts 9–10", "Acts 11–12"], ot: ["Nahum 1:1–6", "Nahum 1:7–15", "Nahum 2:1–10", "Nahum 2:11–13", "Nahum 3"] },
    "2026-10-19": { mem: "Galatians 3:26", nt1: ["Hebrews 7", "Hebrews 8", "Hebrews 9", "Hebrews 10", "Hebrews 11"], nt4: ["Acts 13–16", "Acts 17–19", "Acts 20–22", "Acts 23–25", "Acts 26–28"], ot: ["Habakkuk 1:1–11", "Habakkuk 1:12–17", "Habakkuk 2:1–11", "Habakkuk 2:12–20", "Habakkuk 3"] },
    "2026-10-26": { mem: "Galatians 4:4–5", nt1: ["Hebrews 12", "Hebrews 13", "James 1", "James 2", "James 3"], nt4: ["Romans 1–4", "Romans 5–7", "Romans 8–10", "Romans 11–13", "Romans 14–16"], ot: ["Zephaniah 1:1–9", "Zephaniah 1:10–18", "Zephaniah 2:1–11", "Zephaniah 2:12–15, 3:1–5", "Zephaniah 3:6–20"] }
  };
  function readingFor(day) {
    var d = dateOf(day);
    var dow = d.getDay(); // 0 Sun … 6 Sat
    var monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((dow + 6) % 7));
    var k = monday.getFullYear() + "-" + String(monday.getMonth() + 1).padStart(2, "0") + "-" + String(monday.getDate()).padStart(2, "0");
    var wk = READINGS[k];
    if (!wk) return null;
    var i = (dow + 6) % 7;
    return { mem: wk.mem, weekend: i > 4, nt1: wk.nt1[i], nt4: wk.nt4[i], ot: wk.ot[i] };
  }

  // ---------- storage ----------
  var STORE = "locktober-v1";
  var DEFAULT_GOALS = [
    { id: "sleep-bedtime", pillar: "physical", label: "Consistent bedtime" },
    { id: "sweat-30", pillar: "physical", label: "30 minutes of exercise" },
    { id: "snack-produce", pillar: "physical", label: "Fruit or veggie at every meal" },
    { id: "sun-outside", pillar: "physical", label: "Get outside" },
    { id: "thought-limit", pillar: "mental", label: "Screen-time limit" },
    { id: "task-plan", pillar: "mental", label: "Plan tomorrow tonight" },
    { id: "beauty-gratitude", pillar: "emotional", label: "Write down one good thing" },
    { id: "belong-meal", pillar: "emotional", label: "Share a meal with someone" },
    { id: "morning-routine", pillar: "spiritual", label: "Morning routine" },
    { id: "purpose-pray-others", pillar: "spiritual", label: "Pray for someone by name" },
    { id: "peace-bible", pillar: "spiritual", label: "Read today’s Bible passage" }
  ];

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && Array.isArray(data.goals) && data.log) {
          if (!data.start) data.start = firstLogged(data.log) || TODAY;
          return data;
        }
      }
    } catch (e) { /* storage blocked: fall through to defaults */ }
    // newcomers start today, so the days before they joined don't count against them
    return freshState();
  }
  function firstLogged(log) {
    var days = Object.keys(log).filter(function (k) { return log[k].length; }).map(function (k) { return Number(k.slice(-2)); });
    return days.length ? Math.min.apply(null, days) : 0;
  }
  var state = load();
  var renderers = [];
  function saveLocal() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* not saved */ }
  }
  function save() {
    saveLocal();
    if (window.Locktober.onSave) window.Locktober.onSave(state);
  }
  function freshState() {
    return { goals: DEFAULT_GOALS.slice(), log: {}, start: TODAY, welcomed: false };
  }

  // Hooks for account.js, which syncs this state to the signed-in person's account.
  window.Locktober = {
    today: TODAY,
    getState: function () { return state; },
    freshState: freshState,
    setState: function (next) {
      state = next && Array.isArray(next.goals) && next.log ? next : freshState();
      if (!state.start) state.start = firstLogged(state.log) || TODAY;
      saveLocal();
      renderers.forEach(function (fn) { fn(); });
    },
    onSave: null
  };
  function hasGoal(id) {
    return state.goals.some(function (g) { return g.id === id; });
  }
  function addGoal(g) {
    if (!hasGoal(g.id)) state.goals.push(g);
    save();
  }
  function removeGoal(id) {
    state.goals = state.goals.filter(function (g) { return g.id !== id; });
    Object.keys(state.log).forEach(function (k) {
      state.log[k] = state.log[k].filter(function (x) { return x !== id; });
    });
    save();
  }

  // ---------- "add to my check-in" buttons on pillar pages ----------
  document.querySelectorAll(".add[data-goal]").forEach(function (btn) {
    function sync() {
      var on = hasGoal(btn.dataset.goal);
      btn.setAttribute("aria-pressed", String(on));
      btn.textContent = on ? "✓ In my check-in" : "+ Add to my check-in";
    }
    btn.addEventListener("click", function () {
      if (hasGoal(btn.dataset.goal)) removeGoal(btn.dataset.goal);
      else addGoal({ id: btn.dataset.goal, pillar: btn.dataset.pillar, label: btn.dataset.label });
      sync();
    });
    sync();
    renderers.push(sync);
  });

  // ---------- daily check-in (home) ----------
  var tracker = document.getElementById("tracker");
  if (tracker) {
    var PILLARS = ["physical", "mental", "emotional", "spiritual"];
    var OVER = now > new Date(YEAR, 9, 31, 23, 59, 59);
    var selected = TODAY;
    var list = document.getElementById("goal-list");
    var dayTitle = document.getElementById("day-title");
    var dayLabel = document.getElementById("day-label");
    var bar = document.getElementById("progress-bar");
    var barText = document.getElementById("progress-text");
    var cal = document.getElementById("calendar");
    var prev = document.getElementById("prev-day");
    var next = document.getElementById("next-day");
    var startSel = document.getElementById("start-day");
    var CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>';

    function doneFor(day) {
      var ids = state.log[key(day)] || [];
      return ids.filter(hasGoal);
    }
    function level(day) {
      var total = state.goals.length;
      if (!total) return 0;
      var f = doneFor(day).length / total;
      if (f === 0) return 0;
      if (f === 1) return 4;
      if (f >= 0.8) return 3;
      if (f >= 0.4) return 2;
      return 1;
    }
    function lockedIn(day) { return level(day) >= 3; }

    // All the numbers the stats, recap and share card use.
    function summary() {
      var locked = 0, checks = 0, best = 0, run = 0;
      for (var i = state.start; i <= TODAY; i++) {
        if (lockedIn(i)) { locked++; run++; best = Math.max(best, run); } else run = 0;
        checks += doneFor(i).length;
      }
      var streak = 0;
      var from = lockedIn(TODAY) ? TODAY : TODAY - 1; // today still counts as "in progress"
      for (var j = from; j >= state.start && lockedIn(j); j--) streak++;
      var days = Math.max(1, TODAY - state.start + 1);
      var pillars = PILLARS.map(function (p) {
        var ids = state.goals.filter(function (g) { return g.pillar === p; }).map(function (g) { return g.id; });
        var hit = 0;
        for (var d = state.start; d <= TODAY; d++) {
          hit += doneFor(d).filter(function (x) { return ids.indexOf(x) !== -1; }).length;
        }
        return { name: p, rate: ids.length ? hit / (ids.length * days) : null };
      });
      return { locked: locked, checks: checks, best: best, streak: streak, days: days, pillars: pillars };
    }

    function renderList() {
      var done = doneFor(selected);
      list.innerHTML = "";
      if (!state.goals.length) {
        list.innerHTML = '<p class="empty">No goals yet. Add one below, or open a lock page and tap “Add to my check-in”.</p>';
      }
      PILLARS.forEach(function (p) {
        var goals = state.goals.filter(function (g) { return g.pillar === p; });
        if (!goals.length) return;
        var group = document.createElement("div");
        group.className = "goal-group p-" + p;
        group.innerHTML = '<p class="label"></p>';
        group.firstChild.textContent = p;
        goals.forEach(function (g) {
          var row = document.createElement("div");
          row.className = "goal";
          var id = "g-" + g.id;
          row.innerHTML =
            '<input type="checkbox" id="' + id + '">' +
            '<label for="' + id + '"><span class="box">' + CHECK + '</span><span class="txt"></span></label>' +
            '<button class="rm" type="button" title="Remove from check-in">×</button>';
          row.querySelector(".txt").textContent = g.label;
          row.querySelector(".rm").setAttribute("aria-label", "Remove " + g.label);
          var cb = row.querySelector("input");
          cb.checked = done.indexOf(g.id) !== -1;
          cb.addEventListener("change", function () {
            var k = key(selected);
            var ids = (state.log[k] || []).filter(function (x) { return x !== g.id; });
            if (cb.checked) ids.push(g.id);
            state.log[k] = ids;
            save();
            renderMeta();
          });
          row.querySelector(".rm").addEventListener("click", function () {
            removeGoal(g.id);
            render();
          });
          group.appendChild(row);
        });
        list.appendChild(group);
      });
    }

    function renderMeta() {
      var d = dateOf(selected);
      dayTitle.textContent = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      dayLabel.textContent = "Day " + selected + " of " + DAYS + (selected === TODAY && !OVER ? " · Today" : "");
      prev.disabled = selected <= state.start;
      next.disabled = selected >= TODAY;

      var total = state.goals.length;
      var n = doneFor(selected).length;
      bar.style.width = (total ? (n / total) * 100 : 0) + "%";
      barText.textContent = n + " of " + total + " done" + (total && n === total ? " · Fully locked in" : "");

      cal.querySelectorAll("button").forEach(function (b) {
        var day = Number(b.dataset.day);
        var before = day < state.start;
        b.dataset.lvl = before ? "" : String(level(day));
        b.classList.toggle("pre", before);
        b.setAttribute("aria-pressed", String(day === selected));
        b.disabled = before || day > TODAY;
      });

      var s = summary();
      document.getElementById("stat-locked").textContent = s.locked;
      document.getElementById("stat-streak").textContent = s.streak;
      document.getElementById("stat-best").textContent = s.best;
      document.getElementById("stat-checks").textContent = s.checks;
      var left = document.getElementById("days-left");
      if (left) left.textContent = String(Math.max(0, DAYS - TODAY));

      var r = readingFor(selected);
      var box = document.getElementById("today-reading");
      if (box) {
        box.hidden = !r;
        if (r) {
          box.innerHTML = '<p class="label">Spiritual Workout Plan</p>' + (r.weekend
            ? "<p>No reading today. Catch up, review your verse or rest.</p>"
            : '<dl><dt>NT · 1 yr</dt><dd></dd><dt>NT · 4 mo</dt><dd></dd><dt>OT · 2 yr</dt><dd></dd></dl>') +
            '<p class="mem">Memorize: <b></b></p>';
          var dds = box.querySelectorAll("dd");
          if (dds.length) { dds[0].textContent = r.nt1; dds[1].textContent = r.nt4; dds[2].textContent = r.ot; }
          box.querySelector(".mem b").textContent = r.mem;
        }
      }

      // after October: recap card
      var recap = document.getElementById("recap");
      if (recap) {
        recap.hidden = !OVER;
        if (OVER) {
          document.getElementById("recap-locked").textContent = s.locked;
          document.getElementById("recap-best").textContent = s.best;
          document.getElementById("recap-checks").textContent = s.checks;
          var top = s.pillars.filter(function (p) { return p.rate !== null; })
            .sort(function (a, b) { return b.rate - a.rate; })[0];
          document.getElementById("recap-lock").textContent = top ? top.name : "–";
        }
      }
    }

    function renderWelcome() {
      var w = document.getElementById("welcome");
      if (!w) return;
      w.hidden = !!state.welcomed || OVER;
      document.getElementById("welcome-day").textContent = "Day " + state.start;
    }

    function render() { renderWelcome(); renderList(); renderMeta(); }

    // build the October grid once
    ["S", "M", "T", "W", "T", "F", "S"].forEach(function (d) {
      var el = document.createElement("span");
      el.className = "dow";
      el.textContent = d;
      cal.appendChild(el);
    });
    var offset = dateOf(1).getDay();
    for (var o = 0; o < offset; o++) cal.appendChild(document.createElement("span"));
    for (var day = 1; day <= DAYS; day++) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.day = String(day);
      b.textContent = String(day);
      b.setAttribute("aria-label", dateOf(day).toLocaleDateString(undefined, { month: "long", day: "numeric" }));
      if (day === TODAY && now.getMonth() === 9) b.setAttribute("aria-current", "date");
      b.addEventListener("click", function (e) {
        selected = Number(e.currentTarget.dataset.day);
        render();
      });
      cal.appendChild(b);
    }

    // "my Locktober started on…" picker, for people who join late
    for (var sd = 1; sd <= TODAY; sd++) {
      var opt = document.createElement("option");
      opt.value = String(sd);
      opt.textContent = "Oct " + sd;
      startSel.appendChild(opt);
    }
    startSel.value = String(state.start);
    startSel.addEventListener("change", function () {
      state.start = Number(startSel.value);
      if (selected < state.start) selected = state.start;
      save();
      render();
    });

    document.getElementById("welcome-ok").addEventListener("click", function () {
      state.welcomed = true;
      save();
      renderWelcome();
    });

    prev.addEventListener("click", function () { if (selected > state.start) { selected--; render(); } });
    next.addEventListener("click", function () { if (selected < TODAY) { selected++; render(); } });

    document.getElementById("add-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("new-goal");
      var text = input.value.trim();
      if (!text) { input.focus(); return; }
      addGoal({ id: "custom-" + Date.now().toString(36), pillar: document.getElementById("new-pillar").value, label: text });
      input.value = "";
      render();
    });

    var reset = document.getElementById("reset");
    var armTimer;
    reset.addEventListener("click", function () {
      if (!reset.classList.contains("armed")) {
        reset.classList.add("armed");
        reset.textContent = "Tap again to erase all goals and check-ins";
        armTimer = setTimeout(function () {
          reset.classList.remove("armed");
          reset.textContent = "Start over";
        }, 4000);
        return;
      }
      clearTimeout(armTimer);
      state = { goals: DEFAULT_GOALS.slice(), log: {}, start: TODAY, welcomed: true };
      save();
      startSel.value = String(state.start);
      selected = TODAY;
      reset.classList.remove("armed");
      reset.textContent = "Start over";
      render();
    });

    // ---------- backup / restore (move to another phone) ----------
    var codeOut = document.getElementById("backup-code");
    var backupMsg = document.getElementById("backup-msg");
    document.getElementById("backup-copy").addEventListener("click", function () {
      var code = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
      codeOut.value = code;
      var done = function () { backupMsg.textContent = "Copied. Paste it into Locktober on your other phone."; };
      var fallback = function () { codeOut.focus(); codeOut.select(); backupMsg.textContent = "Code selected. Copy it, then paste it on your other phone."; };
      try { navigator.clipboard.writeText(code).then(done, fallback); } catch (e) { fallback(); }
    });
    document.getElementById("backup-restore").addEventListener("click", function () {
      try {
        var data = JSON.parse(decodeURIComponent(escape(atob(codeOut.value.trim()))));
        if (!data || !Array.isArray(data.goals) || !data.log) throw new Error("bad");
        state = data;
        if (!state.start) state.start = 1;
        state.welcomed = true;
        save();
        startSel.value = String(Math.min(state.start, TODAY));
        backupMsg.textContent = "Restored. Your goals and check-ins are back.";
        render();
      } catch (e) {
        backupMsg.textContent = "That code didn’t work. Copy the whole thing from your other phone and try again.";
      }
    });

    // ---------- share card ----------
    var dialog = document.getElementById("share-dialog");
    var shareImg = document.getElementById("share-img");
    var shareSave = document.getElementById("share-save");
    var shareSend = document.getElementById("share-send");
    var shareFile = null;
    document.querySelectorAll("[data-share]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.disabled = true;
        drawShareCard(summary(), OVER).then(function (canvas) {
          btn.disabled = false;
          canvas.toBlob(function (blob) {
            if (!blob) return;
            shareFile = new File([blob], "my-locktober.png", { type: "image/png" });
            var url = URL.createObjectURL(blob);
            shareImg.src = url;
            shareSave.href = url;
            shareSend.hidden = !(navigator.canShare && navigator.canShare({ files: [shareFile] }));
            if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
          }, "image/png");
        });
      });
    });
    shareSend.addEventListener("click", function () {
      if (!shareFile) return;
      navigator.share({ files: [shareFile], title: "My Locktober" }).catch(function () { /* cancelled */ });
    });
    document.getElementById("share-close").addEventListener("click", function () {
      if (dialog.close) dialog.close(); else dialog.removeAttribute("open");
    });

    renderers.push(function () {
      startSel.value = String(Math.min(state.start, TODAY));
      if (selected < state.start) selected = state.start;
      render();
    });
    if (!state.welcomed) saveLocal(); // remember a newcomer's start day
    render();
  }

  // Draws a 1080×1920 story image in the Locktober style.
  function drawShareCard(s, recap) {
    var C = { coral: "#d65c45", ray: "#e2452f", maroon: "#4a1714", maroon2: "#5c211c", teal: "#173f37", sage: "#6f9486", sage2: "#8fb0a3", white: "#ffffff" };
    var fontsReady = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('800 100px "Inter Tight"'), document.fonts.load('800 40px "Montserrat"')]).catch(function () {})
      : Promise.resolve();
    return fontsReady.then(function () {
      var W = 1080, H = 1920;
      var cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      var x = cv.getContext("2d");
      var display = '"Inter Tight", "Helvetica Neue", Arial, sans-serif';
      var body = 'Montserrat, "Avenir Next", Arial, sans-serif';
      function star(cx, cy, n, ro, ri, rot) {
        x.beginPath();
        for (var i = 0; i < n * 2; i++) {
          var a = (Math.PI * i) / n + (rot || -Math.PI / 2);
          var r = i % 2 ? ri : ro;
          x.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        x.closePath();
        x.fill();
      }
      function caps(text, px, y, size, color, spacing, align) {
        x.font = "800 " + size + "px " + body;
        x.fillStyle = color;
        x.textAlign = "left";
        var chars = text.toUpperCase().split("");
        var width = chars.reduce(function (w, ch) { return w + x.measureText(ch).width + spacing; }, -spacing);
        var cur = align === "center" ? px - width / 2 : align === "right" ? px - width : px;
        chars.forEach(function (ch) { x.fillText(ch, cur, y); cur += x.measureText(ch).width + spacing; });
      }
      function big(text, px, y, size, color, align) {
        x.font = "800 " + size + "px " + display;
        x.fillStyle = color;
        x.textAlign = align || "left";
        if ("letterSpacing" in x) x.letterSpacing = Math.round(-size * 0.045) + "px";
        x.fillText(text, px, y);
        if ("letterSpacing" in x) x.letterSpacing = "0px";
      }

      // top: coral with rays
      x.fillStyle = C.coral; x.fillRect(0, 0, W, 1060);
      x.strokeStyle = C.ray; x.lineCap = "butt";
      [[-80, 520, 1200, 140, 34], [-60, 820, 1180, 980, 22], [200, 1060, 1200, 700, 16]].forEach(function (l) {
        x.lineWidth = l[4]; x.beginPath(); x.moveTo(l[0], l[1]); x.lineTo(l[2], l[3]); x.stroke();
      });
      // bottom: maroon with a burst
      x.fillStyle = C.maroon; x.fillRect(0, 1060, W, H - 1060);
      x.save();
      x.beginPath(); x.rect(0, 1060, W, H - 1060); x.clip();
      x.fillStyle = C.maroon2; star(W + 40, 1900, 14, 620, 220, 0);
      x.restore();

      // badge
      var tiles = [[C.maroon, C.ray, 18, 0.45], [C.white, C.maroon, 8, 0.62], [C.teal, C.sage, 24, 0.2], [C.sage, C.teal, 9, 0.45]];
      tiles.forEach(function (t, i) {
        var tx = 96 + i * 104, ty = 120;
        x.fillStyle = t[0]; x.fillRect(tx, ty, 104, 104);
        x.fillStyle = t[1]; star(tx + 52, ty + 52, t[2], 46, 46 * t[3]);
      });

      big("Locktober", 92, 420, 168, C.white);
      caps(recap ? "My Locktober " + YEAR : "October " + YEAR + " · Day " + TODAY + " of 31", 96, 500, 34, C.white, 7);

      var hero = recap ? s.locked : s.streak;
      big(String(hero), 92, 880, 380, C.white);
      caps(recap ? "Days locked in" : "Day streak", 100, 960, 40, C.white, 8);

      // stat row
      var stats = recap
        ? [[s.best, "Best streak"], [s.checks, "Check-offs"], [s.days, "Days in"]]
        : [[s.locked, "Days locked in"], [s.best, "Best streak"], [s.checks, "Check-offs"]];
      stats.forEach(function (st, i) {
        var sx = 96 + i * 300;
        big(String(st[0]), sx, 1230, 120, C.coral);
        caps(st[1], sx + 4, 1285, 24, C.white, 4);
      });

      // four locks
      caps("The four locks", 96, 1400, 28, C.coral, 6);
      var colors = { physical: C.coral, mental: C.white, emotional: C.sage2, spiritual: C.sage };
      s.pillars.forEach(function (p, i) {
        var y = 1460 + i * 92;
        caps(p.name, 96, y + 30, 30, C.white, 5);
        x.fillStyle = "rgba(255,255,255,0.14)"; x.fillRect(400, y, 440, 40);
        var rate = p.rate === null ? 0 : Math.min(1, p.rate);
        x.fillStyle = colors[p.name]; x.fillRect(400, y, Math.max(6, 440 * rate), 40);
        caps(p.rate === null ? "–" : Math.round(rate * 100) + "%", 984, y + 32, 30, C.white, 3, "right");
      });

      var where = (location.host + location.pathname).replace(/index\.html$/, "").replace(/\/$/, "");
      caps(where || "Locktober", 96, 1850, 26, "rgba(255,255,255,0.75)", 4);
      return cv;
    });
  }

  // ---------- highlight this week's row in the reading plan ----------
  document.querySelectorAll("tr[data-week]").forEach(function (row) {
    var start = new Date(row.dataset.week + "T00:00:00");
    var end = new Date(start.getTime() + 7 * 864e5);
    if (now >= start && now < end) row.classList.add("now");
  });

  // ---------- sunrise / sunset in Ames, IA (suncalc's sunrise equation) ----------
  var riseEl = document.getElementById("sunrise");
  var setEl = document.getElementById("sunset");
  if (riseEl && setEl) {
    var t = sunTimes(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12), 42.0308, -93.6319);
    var fmt = { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" };
    var split = function (d) {
      var s = d.toLocaleTimeString("en-US", fmt);
      var parts = s.split(" ");
      return parts[0] + "<small>" + (parts[1] || "").toLowerCase() + "</small>";
    };
    riseEl.innerHTML = split(t.rise);
    setEl.innerHTML = split(t.set);
  }
  function sunTimes(date, lat, lng) {
    var rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, J0 = 0.0009;
    var e = rad * 23.4397, lw = rad * -lng, phi = rad * lat;
    var d = date.valueOf() / dayMs - 0.5 + J1970 - J2000;
    var n = Math.round(d - J0 - lw / (2 * Math.PI));
    var ds = J0 + lw / (2 * Math.PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(e) * Math.sin(L));
    var Jnoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    var a = J0 + (w + lw) / (2 * Math.PI) + n;
    var Jset = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var Jrise = Jnoon - (Jset - Jnoon);
    var from = function (j) { return new Date((j + 0.5 - J1970) * dayMs); };
    return { rise: from(Jrise), set: from(Jset) };
  }

  // ---------- focus timer (Mental → Task) ----------
  var timer = document.getElementById("timer");
  if (timer) {
    var face = document.getElementById("timer-face");
    var go = document.getElementById("timer-go");
    var modes = timer.querySelectorAll("[data-min]");
    var length = 25 * 60, left = length, tick = null;
    var show = function () {
      var m = Math.floor(left / 60), s = left % 60;
      face.textContent = m + ":" + (s < 10 ? "0" : "") + s;
    };
    var stop = function () { clearInterval(tick); tick = null; go.textContent = "Start"; };
    go.addEventListener("click", function () {
      if (tick) { stop(); return; }
      if (left <= 0) left = length;
      go.textContent = "Pause";
      tick = setInterval(function () {
        left--;
        show();
        if (left <= 0) { stop(); face.textContent = "Done!"; }
      }, 1000);
    });
    document.getElementById("timer-reset").addEventListener("click", function () { stop(); left = length; show(); });
    modes.forEach(function (b) {
      b.addEventListener("click", function () {
        modes.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        stop();
        length = left = Number(b.dataset.min) * 60;
        show();
      });
    });
    show();
  }

  // ---------- beauty prompts (Emotional → Beauty) ----------
  var promptBtn = document.getElementById("prompt-next");
  if (promptBtn) {
    var PROMPTS = [
      "Find the most colorful tree on your walk to class.",
      "Watch the sky change for five full minutes without your phone.",
      "Listen for three different birds or sounds you usually tune out.",
      "Notice the light coming through a window at golden hour.",
      "Take the long way home and look up the whole time.",
      "Find one small thing someone made with care, and thank them for it.",
      "Step outside after dark and count the stars you can see.",
      "Read a chapter of a fun book somewhere you've never read before.",
      "Pick up a leaf that's changing color and really look at it.",
      "Write down three good things from today before bed."
    ];
    var promptText = document.getElementById("prompt-text");
    var idx = now.getDate() % PROMPTS.length;
    promptText.textContent = PROMPTS[idx];
    promptBtn.addEventListener("click", function () {
      idx = (idx + 1) % PROMPTS.length;
      promptText.textContent = PROMPTS[idx];
    });
  }

  // ---------- breath prayer (Spiritual → Peace) ----------
  var breath = document.getElementById("breath");
  if (breath) {
    var ring = breath.querySelector(".breath__ring");
    var words = ring.querySelector("span");
    var bbtn = document.getElementById("breath-go");
    var loop = null;
    var phase = function (inhale) {
      ring.classList.toggle("in", inhale);
      words.textContent = inhale ? "Breathe in: Be still," : "Breathe out: and know that I am God.";
    };
    bbtn.addEventListener("click", function () {
      if (loop) {
        clearInterval(loop); loop = null;
        ring.classList.remove("in");
        words.textContent = "Be still, and know that I am God.";
        bbtn.textContent = "Start breath prayer";
        return;
      }
      var inhale = true;
      phase(inhale);
      loop = setInterval(function () { inhale = !inhale; phase(inhale); }, 4000);
      bbtn.textContent = "Stop";
    });
  }

  // ---------- add to home screen (Android/Chrome offers an install prompt) ----------
  var installBtn = document.getElementById("install-btn");
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });
  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt = null;
      installBtn.hidden = true;
    });
  }
})();
