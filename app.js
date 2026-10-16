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
    { id: "sleep-wake", pillar: "physical", label: "Up by 6:30 or earlier" },
    { id: "sweat-train", pillar: "physical", label: "Lift or run" },
    { id: "snack-whole", pillar: "physical", label: "Whole foods, no gluten or fast food" },
    { id: "sun-rise-set", pillar: "physical", label: "Catch the sunrise or sunset" },
    { id: "thought-noshort", pillar: "mental", label: "No short-form content" },
    { id: "morning-routine", pillar: "spiritual", label: "Morning routine" },
    { id: "task-analog", pillar: "mental", label: "Paper & analog planning" },
    { id: "beauty-walk", pillar: "emotional", label: "Take a walk" },
    { id: "belong-people", pillar: "emotional", label: "Real time with my people" },
    { id: "purpose-obey", pillar: "spiritual", label: "Daily obedience" },
    { id: "peace-closet", pillar: "spiritual", label: "Prayer closet before my phone" }
  ];

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && Array.isArray(data.goals) && data.log) return data;
      }
    } catch (e) { /* storage blocked: fall through to defaults */ }
    return { goals: DEFAULT_GOALS.slice(), log: {} };
  }
  var state = load();
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* not saved */ }
  }
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
  });

  // ---------- daily check-in (home) ----------
  var tracker = document.getElementById("tracker");
  if (tracker) {
    var PILLARS = ["physical", "mental", "emotional", "spiritual"];
    var selected = TODAY;
    var list = document.getElementById("goal-list");
    var dayTitle = document.getElementById("day-title");
    var dayLabel = document.getElementById("day-label");
    var bar = document.getElementById("progress-bar");
    var barText = document.getElementById("progress-text");
    var cal = document.getElementById("calendar");
    var prev = document.getElementById("prev-day");
    var next = document.getElementById("next-day");
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
      dayLabel.textContent = "Day " + selected + " of " + DAYS + (selected === TODAY ? " · Today" : "");
      prev.disabled = selected <= 1;
      next.disabled = selected >= TODAY;

      var total = state.goals.length;
      var n = doneFor(selected).length;
      bar.style.width = (total ? (n / total) * 100 : 0) + "%";
      barText.textContent = n + " of " + total + " done" + (total && n === total ? " · Fully locked in" : "");

      // calendar
      cal.querySelectorAll("button").forEach(function (b) {
        var day = Number(b.dataset.day);
        b.dataset.lvl = String(level(day));
        b.setAttribute("aria-pressed", String(day === selected));
        b.disabled = day > TODAY;
      });

      // stats
      var locked = 0, checks = 0;
      for (var i = 1; i <= TODAY; i++) {
        if (lockedIn(i)) locked++;
        checks += doneFor(i).length;
      }
      var streak = 0;
      var start = lockedIn(TODAY) ? TODAY : TODAY - 1; // today still counts as "in progress"
      for (var j = start; j >= 1 && lockedIn(j); j--) streak++;
      document.getElementById("stat-locked").textContent = locked;
      document.getElementById("stat-streak").textContent = streak;
      document.getElementById("stat-checks").textContent = checks;
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
      var left = document.getElementById("days-left");
      if (left) left.textContent = String(Math.max(0, DAYS - TODAY));
    }

    function render() { renderList(); renderMeta(); }

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

    prev.addEventListener("click", function () { if (selected > 1) { selected--; render(); } });
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
      state = { goals: DEFAULT_GOALS.slice(), log: {} };
      save();
      reset.classList.remove("armed");
      reset.textContent = "Start over";
      render();
    });

    render();
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
})();
