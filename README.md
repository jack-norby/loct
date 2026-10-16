# Locktober

A for-fun website for **Locktober**: 31 days of getting locked in during October. It covers four areas of rest, styled after Cornerstone's Spiritual Workout Plan.

| Page | Lock | Goals |
| --- | --- | --- |
| `index.html` | Home | Daily check-in, October calendar, memory verses, lock-in partner questions |
| `physical.html` | Physical | Sleep · Sweat · Snack · Sunlight |
| `mental.html` | Mental | Thought · Task |
| `emotional.html` | Emotional | Beauty · Belonging |
| `spiritual.html` | Spiritual | Purpose · Peace |

## Features

- **Daily check-in**: check off your goals each day. Each lock page has "Add to my check-in" buttons, and you can add your own goals.
- **Accounts (optional)**: people can sign in with Google or email so their goals and check-ins follow them to any device. Off until you connect a free Firebase project; see [ACCOUNTS.md](ACCOUNTS.md). Without it, everything saves on each person's device.
- **Join any day**: newcomers start on the day they arrive, so earlier days don't count against them. "My Locktober started on" lets you change that.
- **Calendar, streaks and stats**: tap any past day to edit it.
- **Share my streak**: makes a story-sized image of your streak and your four locks to post.
- **Recap**: after October 31 the check-in shows "Here's your Locktober."
- **Move to another phone**: without an account, copy a backup code and restore it on another device.
- **Add to home screen**: the app icon and manifest let it open like an app.
- **Spiritual Workout Plan tie-in**: October readings and memory verses (Fall 2026), plus today's reading for each track.
- **Extras on the lock pages**: Ames sunrise/sunset times, a focus timer, beauty prompts and a breath prayer.

## Run it

It's plain HTML, CSS and JS. There's no build step and every file sits in one folder, so you can drag them all into GitHub's "Upload files" page. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

To put it online for free, turn on **GitHub Pages** (Settings → Pages → deploy from the `main` branch, root folder).

## Editing

- Page text lives in the `.html` files.
- Colors and fonts are at the top of `style.css`.
- The starter check-in goals (`DEFAULT_GOALS`) and the October reading plan (`READINGS`) are at the top of `app.js`.
- Sign-in and syncing live in `account.js`, and the Firebase settings go in `firebase-config.js`.

Made for fun by students in a college ministry. Not an official Cornerstone Church resource. Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.
