/* Locktober accounts: sign in with Google or email, and sync goals and
   check-ins to Firestore at users/{uid}. Does nothing until
   firebase-config.js has a config (see ACCOUNTS.md). */
(function () {
  "use strict";

  var L = window.Locktober;
  var cfg = window.LOCKTOBER_FIREBASE;
  var btn = document.getElementById("account-btn");
  var note = document.getElementById("sync-note");
  if (!L || !cfg) return; // accounts not set up: everything stays on this device

  var SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
  var auth, db, ref = null, unsub = null, user = null;
  var pending = null; // debounced write timer

  // ---------- sign-in window ----------
  var dlg = document.createElement("dialog");
  dlg.className = "account-dialog";
  dlg.setAttribute("aria-label", "Your Locktober account");
  dlg.innerHTML =
    '<div class="acct-out">' +
      '<p class="label">Your account</p>' +
      '<h3>Sign in to Locktober</h3>' +
      '<p>Save your goals and check-ins to your account so they follow you to any phone or laptop.</p>' +
      '<button class="btn btn--dark acct-google" type="button">Continue with Google</button>' +
      '<p class="acct-or">or use email</p>' +
      '<form class="acct-form">' +
        '<label for="acct-email">Email</label>' +
        '<input id="acct-email" type="email" autocomplete="email" required>' +
        '<label for="acct-pass">Password</label>' +
        '<input id="acct-pass" type="password" autocomplete="current-password" minlength="6" required>' +
        '<div class="btn-row">' +
          '<button class="btn btn--dark" type="submit" value="signin">Sign in</button>' +
          '<button class="btn btn--ghost" type="submit" value="signup">Create account</button>' +
        '</div>' +
        '<button class="acct-link acct-forgot" type="button">Forgot password?</button>' +
      '</form>' +
    '</div>' +
    '<div class="acct-in" hidden>' +
      '<p class="label">Your account</p>' +
      '<h3>You’re signed in.</h3>' +
      '<p>Signed in as <b class="acct-who"></b>. Your goals and check-ins save to your account automatically.</p>' +
      '<button class="btn btn--dark acct-signout" type="button">Sign out</button>' +
      '<p class="acct-small">Signing out removes Locktober from this device. Everything stays safe in your account.</p>' +
    '</div>' +
    '<p class="acct-msg" role="status"></p>' +
    '<button class="acct-close" type="button" aria-label="Close">×</button>';
  document.body.appendChild(dlg);
  var $ = function (sel) { return dlg.querySelector(sel); };
  var msg = $(".acct-msg");

  function open() {
    msg.textContent = "";
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function close() {
    if (dlg.close) dlg.close(); else dlg.removeAttribute("open");
  }
  $(".acct-close").addEventListener("click", close);
  if (btn) {
    btn.hidden = false;
    btn.addEventListener("click", open);
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-account-open]")) { e.preventDefault(); open(); }
  });

  function friendly(err) {
    var code = (err && err.code) || "";
    if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) return "That email and password don’t match. Try again, or create an account.";
    if (/email-already-in-use/.test(code)) return "There’s already an account with that email. Tap Sign in instead.";
    if (/weak-password/.test(code)) return "Use a password with at least 6 characters.";
    if (/invalid-email/.test(code)) return "That email doesn’t look right.";
    if (/too-many-requests/.test(code)) return "Too many tries. Wait a minute and try again.";
    if (/network-request-failed/.test(code)) return "No connection. Check your internet and try again.";
    if (/popup-closed-by-user|cancelled-popup-request/.test(code)) return "";
    if (/unauthorized-domain/.test(code)) return "This website isn’t on the Firebase authorized domains list yet (see ACCOUNTS.md).";
    return "Something went wrong. Try again.";
  }
  function fail(err) { msg.textContent = friendly(err); }

  // ---------- sync ----------
  function setNote() {
    if (!note) return;
    if (user) {
      note.innerHTML = "Saved to your account (<b></b>).";
      note.querySelector("b").textContent = user.email || "signed in";
    } else {
      note.innerHTML = 'Saved on this device only. <button class="acct-link" type="button" data-account-open>Sign in</button> to save to your account.';
    }
  }

  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (v && typeof v === "object") {
      return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + stable(v[k]); }).join(",") + "}";
    }
    return JSON.stringify(v);
  }
  function untouched(s) {
    var logged = Object.keys(s.log).some(function (k) { return s.log[k].length; });
    return !logged && stable(s.goals) === stable(L.freshState().goals);
  }
  // Combine this device's data with the account's the first time they meet.
  function merge(cloud, local) {
    if (untouched(local)) return cloud;
    var goals = cloud.goals.slice();
    local.goals.forEach(function (g) {
      if (!goals.some(function (c) { return c.id === g.id; })) goals.push(g);
    });
    var log = {};
    [cloud.log, local.log].forEach(function (src) {
      Object.keys(src).forEach(function (k) {
        log[k] = (log[k] || []).concat(src[k].filter(function (id) { return (log[k] || []).indexOf(id) === -1; }));
      });
    });
    return { goals: goals, log: log, start: Math.min(cloud.start || 31, local.start || 31), welcomed: true };
  }

  function write(s) {
    if (!ref) return;
    ref.set({ state: JSON.parse(JSON.stringify(s)), updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
      .catch(function () { if (note) note.textContent = "Couldn’t save to your account. Your check-ins are still saved on this device."; });
  }
  function queueWrite(s) {
    clearTimeout(pending);
    pending = setTimeout(function () { pending = null; write(L.getState()); }, 600);
  }

  function connect(u) {
    user = u;
    ref = db.collection("users").doc(u.uid);
    $(".acct-out").hidden = true;
    $(".acct-in").hidden = false;
    $(".acct-who").textContent = u.email || "your account";
    if (btn) { btn.textContent = "Account"; btn.classList.add("signed-in"); }
    document.querySelectorAll(".backup").forEach(function (el) { el.hidden = true; });
    setNote();
    ref.get().then(function (snap) {
      var local = L.getState();
      var cloud = snap.exists && snap.data().state;
      var next = cloud ? merge(cloud, local) : local;
      next.welcomed = true;
      L.setState(next);
      write(next);
      L.onSave = queueWrite;
      unsub = ref.onSnapshot(function (s) {
        // skip our own echoes and anything older than an edit waiting to upload
        if (!s.exists || s.metadata.hasPendingWrites || pending) return;
        var remote = s.data().state;
        if (remote && stable(remote) !== stable(L.getState())) L.setState(remote);
      });
    }).catch(function () {
      if (note) note.textContent = "Couldn’t reach your account. Your check-ins are saved on this device for now.";
    });
  }

  function disconnect() {
    if (unsub) unsub();
    unsub = null; ref = null; user = null;
    clearTimeout(pending); pending = null;
    L.onSave = null;
    $(".acct-out").hidden = false;
    $(".acct-in").hidden = true;
    if (btn) { btn.textContent = "Sign in"; btn.classList.remove("signed-in"); }
    document.querySelectorAll(".backup").forEach(function (el) { el.hidden = false; });
    setNote();
  }

  // ---------- wire up the buttons ----------
  $(".acct-google").addEventListener("click", function () {
    msg.textContent = "";
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(close).catch(function (err) {
      if (err && err.code === "auth/popup-blocked") return auth.signInWithRedirect(provider);
      fail(err);
    });
  });
  var lastSubmit = "signin";
  dlg.querySelectorAll('.acct-form [type="submit"]').forEach(function (b) {
    b.addEventListener("click", function () { lastSubmit = b.value; });
  });
  $(".acct-form").addEventListener("submit", function (e) {
    e.preventDefault();
    msg.textContent = "";
    var email = $("#acct-email").value.trim();
    var pass = $("#acct-pass").value;
    var go = lastSubmit === "signup"
      ? auth.createUserWithEmailAndPassword(email, pass)
      : auth.signInWithEmailAndPassword(email, pass);
    go.then(function () { $("#acct-pass").value = ""; close(); }).catch(fail);
  });
  $(".acct-forgot").addEventListener("click", function () {
    var email = $("#acct-email").value.trim();
    if (!email) { msg.textContent = "Type your email above first, then tap Forgot password."; return; }
    auth.sendPasswordResetEmail(email)
      .then(function () { msg.textContent = "Check your email for a link to reset your password."; })
      .catch(fail);
  });
  $(".acct-signout").addEventListener("click", function () {
    auth.signOut().then(function () {
      L.setState(L.freshState()); // shared computers: don't leave someone's goals behind
      msg.textContent = "Signed out. Your check-ins are saved in your account.";
    });
  });

  // ---------- load Firebase, then start ----------
  function load(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = SDK + src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  setNote();
  load("firebase-app-compat.js")
    .then(function () { return Promise.all([load("firebase-auth-compat.js"), load("firebase-firestore-compat.js")]); })
    .then(function () {
      firebase.initializeApp(cfg);
      auth = firebase.auth();
      db = firebase.firestore();
      auth.onAuthStateChanged(function (u) { if (u) connect(u); else disconnect(); });
    })
    .catch(function () {
      if (btn) btn.hidden = true;
      if (note) note.textContent = "Saved on this device only. Accounts couldn’t load right now.";
    });
})();
