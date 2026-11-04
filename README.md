# Mighty Bites 💪🍎

### ▶️ **[Play it here](https://travischapman.github.io/mighty-bites/)**

A playful, kid-friendly PWA to help a child **try new healthy foods** and **hit a daily
protein goal**, while also seeing **carbs, fat, and fiber**. Buddy the mascot starts squishy
and glum and powers up into a muscular weightlifter as protein adds up — hit the goal and he
lifts heavy weights overhead with a confetti celebration. The other macros are extra fuel;
they do not change Buddy or Tournament Mode.

Everything is stored **locally** on the device (nothing leaves the browser). A **parent PIN**
confirms how much was actually eaten before it counts.

## Features

- **Buddy the mascot** — five stages driven by protein-eaten vs. goal (squishy & sad → mighty lifter).
- **Parent PIN mode** — kids log foods as *pending*; a grown-up enters the PIN and confirms the
  amount before any macros count. Adjust by quarter-servings, or **type the exact protein grams**
  when a kid only picks at a portion. Daily goals are PIN-locked.
- **Four macros** — every food has protein, carbs, fat, and fiber per serving. Confirmed bites add
  all four to the day. Home shows them as kid-labeled bars (muscles, play energy, brain fuel,
  tummy helper). Protein is still the goal that powers Buddy.
- **Calorie mix on each food** — a stacked bar plus percents shows how that food's calories split
  into protein, carbs, and fat. Fiber is shown in grams beside the bar (it isn't part of the split).
- **Food Explorer** — 79 healthy foods across **Proteins**, **Carbs & Produce**, and **Healthy Fats**
  (foods can belong to several categories, e.g. eggs are protein *and* fat).
- **Treasure discovery** — the first time a food is confirmed, a collectible treasure is unlocked.
- **Daily goals** — protein defaults to 40 g (10–100). Gentle targets for the others: carbs 130 g,
  fat 40 g, fiber 15 g. A parent can change all four after the PIN. They are not medical advice.
- **Tournament Mode** — unlocks after hitting the day's **protein** goal. Play a kid-friendly
  Flex / Jump / Spin bracket against food-themed foes **once per calendar day**, earn awards
  (champion, runner-up, participation), and track championships in localStorage.
- **Installable, offline PWA** — React, Babel, and the fonts are all vendored locally, so it works
  with no internet after the first load.

## Run it

It's a static site — no build step. Serve the folder over HTTP (a service worker needs `http(s)`,
not `file://`):

```bash
cd mighty-bites
python3 -m http.server 8080
```

Then open **http://localhost:8080** in a browser.

### Tests

Nutrition math lives in `nutrition.js` (plain JavaScript, no React) so Node can test it without
a build. `foods.jsx` is also plain JavaScript; the tests load it in a small sandbox.

```bash
node --test
# or
npm test
```

### Install to a phone (home-screen app)

Open **https://travischapman.github.io/mighty-bites/** on the phone and use the browser's
**Add to Home Screen** (iOS Safari) or **Install app** (Android Chrome) option. It launches
full-screen with its own icon and works offline afterwards.

## First run

1. Enter the child's name.
2. A grown-up sets a 4-digit **Parent PIN**.
3. Tap **Food Explorer**, pick foods the child ate — each becomes a *pending* item.
4. A grown-up taps **✓ Confirm**, enters the PIN, and sets how much was really eaten — either with
   the ± serving stepper or by typing the protein grams directly. All four macros count and Buddy
   powers up from protein. New foods pop a treasure!

## How portions scale

Every macro uses the same serving.

- **Stepper:** ½ a serving is half the protein, carbs, fat, and fiber.
- **Typed protein:** carbs, fat, and fiber scale by `typed grams ÷ protein per serving`.
  Chicken is 26 g protein and 3 g fat; typing 13 g protein records 13 g protein and 1.5 g fat.
  The protein stored is the typed number. The log's serving label is that fraction, rounded to
  one decimal.
- **No protein in the food** (olive oil): a typed protein number can't name a fraction, so the
  stepper still sets carbs, fat, and fiber, and the typed protein is stored as entered.

Percents on a food card are shares of **calories** (protein and carbs 4 kcal/g, fat 9 kcal/g),
rounded so the three numbers add to 100. Fiber stays in grams. A food with no calories shows
0% / 0% / 0% instead of pretending to total 100.

## Saved data

Logs stay in `mighty.v1`. Older entries that only stored protein are filled in from the catalog
on load, using the same portion rules (a protein amount that doesn't match the serving count is
treated as typed grams). An entry that already has all four macros is left alone. If the food
is no longer in the catalog, protein is kept and the missing macros show as "—" — the app does
not crash. Carb, fat, and fiber goals are new fields in `mighty.settings`; older settings pick
up the defaults.

## Project layout

| File | Purpose |
|------|---------|
| `index.html` | App shell + PWA metadata + service-worker registration |
| `app.jsx` | Main app: logging, PIN confirm flow, macro totals, views, celebration |
| `nutrition.js` | Portion scaling, calorie percents, daily totals, old-save migration |
| `foods.jsx` | The 79-food database (protein, carbs, fat, fiber, servings, categories) |
| `test/nutrition.test.js` | Node tests for macros, the catalog, and migration |
| `treasures.jsx` | 100 collectible treasures + rarity-weighted draw |
| `mascot.jsx` | `Buddy` — the CSS/DOM mascot with five strength stages |
| `tournament.jsx` | Tournament Mode: bracket, matches, awards |
| `tweaks-panel.jsx` | Settings panel toolkit (name, PIN-locked goal, reset) |
| `styles.css` | All styling, including Buddy's animations |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA manifest, offline service worker, app icons |
| `vendor/` | Local React, ReactDOM, Babel, and fonts (offline-capable) |

No accounts, no servers, no tracking — all data lives in `localStorage`.
