# Mighty Bites 💪🍎

A playful, kid-friendly PWA to help a child **try new healthy foods** and **hit a daily
protein goal**. Buddy the mascot starts squishy and glum and powers up into a muscular
weightlifter as protein adds up — hit the goal and he lifts heavy weights overhead with a
confetti celebration.

Everything is stored **locally** on the device (nothing leaves the browser). A **parent PIN**
confirms how much was actually eaten before it counts.

## Features

- **Buddy the mascot** — five stages driven by protein-eaten vs. goal (squishy & sad → mighty lifter).
- **Parent PIN mode** — kids log foods as *pending*; a grown-up enters the PIN and confirms the
  serving amount before protein counts. The daily goal is also PIN-locked.
- **Food Explorer** — 79 healthy foods across **Proteins**, **Carbs & Produce**, and **Healthy Fats**
  (foods can belong to several categories, e.g. eggs are protein *and* fat).
- **Treasure discovery** — the first time a food is confirmed, a collectible treasure is unlocked.
- **Daily protein goal** — default 40 g, adjustable by a parent (10–100 g).
- **Installable, offline PWA** — React, Babel, and the fonts are all vendored locally, so it works
  with no internet after the first load.

## Run it

It's a static site — no build step. Serve the folder over HTTP (a service worker needs `http(s)`,
not `file://`):

```bash
cd protein-tracker
python3 -m http.server 8080
```

Then open **http://localhost:8080** in a browser.

### Install to a phone (home-screen app)

Serve it over HTTPS (or `localhost`) and use the browser's **Add to Home Screen** / **Install**
option. It launches full-screen with its own icon and works offline.

## First run

1. Enter the child's name.
2. A grown-up sets a 4-digit **Parent PIN**.
3. Tap **Food Explorer**, pick foods the child ate — each becomes a *pending* item.
4. A grown-up taps **✓ Confirm**, enters the PIN, and adjusts servings → protein counts and Buddy
   powers up. New foods pop a treasure!

## Project layout

| File | Purpose |
|------|---------|
| `index.html` | App shell + PWA metadata + service-worker registration |
| `app.jsx` | Main app: logging, PIN confirm flow, views, celebration |
| `foods.jsx` | The 79-food database (protein grams, servings, multi-category tags) |
| `treasures.jsx` | 100 collectible treasures + rarity-weighted draw |
| `mascot.jsx` | `Buddy` — the CSS/DOM mascot with five strength stages |
| `tweaks-panel.jsx` | Settings panel toolkit (name, PIN-locked goal, reset) |
| `styles.css` | All styling, including Buddy's animations |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA manifest, offline service worker, app icons |
| `vendor/` | Local React, ReactDOM, Babel, and fonts (offline-capable) |

No accounts, no servers, no tracking — all data lives in `localStorage`.
