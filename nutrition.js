// nutrition.js — pure macro math for Mighty Bites.
// Plain JavaScript on purpose: the browser loads it with a <script> tag (no build),
// and Node tests require() it. No React, no DOM.
//
// Grams are rounded to one decimal, same as the protein numbers the app already stores.
//
// How a portion is counted
// ------------------------
// Stepper (quarter-servings): every macro scales by the serving count.
//   0.5 servings → half the protein, carbs, fat, and fiber.
//
// Typed protein grams: the number the parent types replaces protein. Carbs, fat,
// and fiber scale by the same fraction of a serving:
//   fraction = typedProtein / proteinPerServing
//   carbs    = carbsPerServing * fraction   (fat and fiber the same way)
// The protein stored is the typed amount, so it won't drift from rounding.
// The saved `servings` is that fraction rounded to one decimal (for the log label).
//
// Foods with 0g protein (olive oil) can't name a fraction from a protein number.
// Carbs, fat, and fiber stay on the stepper's servings, and the typed protein is
// stored as entered.
//
// Percents are the share of *calories* (protein 4 kcal/g, carbs 4, fat 9), not
// grams — fat packs more energy per gram, so a gram split would understate it.
// Fiber is not part of that split; it's shown as its own grams. Integer percents
// use the largest-remainder method so protein + carbs + fat = 100 whenever the
// food has any calories. A zero-calorie food stays 0 / 0 / 0 (it does not pretend
// to add up to 100).
//
// Old saved logs: an entry that already has all four macros is kept as-is.
// Otherwise we backfill from the catalog with the rules above. A food that is
// gone from the catalog keeps whatever numbers it has and leaves the rest unknown
// (null) — callers must tolerate null and never crash.

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MightyNutrition = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  // Gentle daily targets for a young kid — not medical advice.
  // Only protein powers Buddy and unlocks Tournament Mode.
  const DEFAULT_GOALS = { protein: 40, carbs: 130, fat: 40, fiber: 15 };
  const MACRO_KEYS = ["protein", "carbs", "fat", "fiber"];
  const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

  const round1 = (n) => Math.round(n * 10) / 10;

  function isNonNeg(n) {
    return typeof n === "number" && Number.isFinite(n) && n >= 0;
  }

  function num(n) {
    return isNonNeg(n) ? n : 0;
  }

  function formatGrams(n) {
    if (!isNonNeg(n)) return "—";
    const r = round1(n);
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  }

  // Servings from the stepper are quarter-steps (two decimals). Garbage, negatives,
  // and huge values are clamped so a bad save can't explode the totals.
  function clampServings(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    const capped = n > 100 ? 100 : n;
    return Math.round(capped * 100) / 100;
  }

  function foodMacros(food) {
    return {
      protein: num(food && food.protein),
      carbs: num(food && food.carbs),
      fat: num(food && food.fat),
      fiber: num(food && food.fiber),
    };
  }

  function scaleMacros(base, factor) {
    const f = Number(factor);
    const safe = Number.isFinite(f) && f > 0 ? f : 0;
    return {
      protein: round1(num(base && base.protein) * safe),
      carbs: round1(num(base && base.carbs) * safe),
      fat: round1(num(base && base.fat) * safe),
      fiber: round1(num(base && base.fiber) * safe),
    };
  }

  function portionMacros(food, options) {
    const opts = options || {};
    const servings = clampServings(opts.servings == null ? 1 : opts.servings);
    const base = foodMacros(food);
    const typed = opts.typedProtein;
    const hasTyped = typed != null && typed !== "" && Number.isFinite(Number(typed));

    if (!hasTyped) return { servings, ...scaleMacros(base, servings) };

    const protein = round1(Math.min(200, Math.max(0, Number(typed))));
    if (base.protein > 0) {
      const fraction = protein / base.protein;
      const scaled = scaleMacros(base, fraction);
      return {
        servings: round1(fraction),
        protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        fiber: scaled.fiber,
      };
    }
    const scaled = scaleMacros(base, servings);
    return { servings, protein, carbs: scaled.carbs, fat: scaled.fat, fiber: scaled.fiber };
  }

  function macroPercents(macros) {
    const protein = num(macros && macros.protein);
    const carbs = num(macros && macros.carbs);
    const fat = num(macros && macros.fat);
    const fiber = round1(num(macros && macros.fiber));
    const kcal = {
      protein: protein * KCAL_PER_GRAM.protein,
      carbs: carbs * KCAL_PER_GRAM.carbs,
      fat: fat * KCAL_PER_GRAM.fat,
    };
    const total = kcal.protein + kcal.carbs + kcal.fat;
    if (!(total > 0)) {
      return { protein: 0, carbs: 0, fat: 0, fiber, totalKcal: 0, hasEnergy: false };
    }
    const keys = ["protein", "carbs", "fat"];
    const raw = {};
    const floored = {};
    let used = 0;
    for (const k of keys) {
      raw[k] = (kcal[k] / total) * 100;
      floored[k] = Math.floor(raw[k] + 1e-9);
      used += floored[k];
    }
    const left = 100 - used;
    const ranked = keys.slice().sort((a, b) => {
      const frac = (raw[b] - floored[b]) - (raw[a] - floored[a]);
      if (Math.abs(frac) > 1e-9) return frac;
      if (kcal[b] !== kcal[a]) return kcal[b] - kcal[a];
      return keys.indexOf(a) - keys.indexOf(b);
    });
    const pct = { protein: floored.protein, carbs: floored.carbs, fat: floored.fat };
    for (let i = 0; i < left; i++) pct[ranked[i]] += 1;
    return { ...pct, fiber, totalKcal: round1(total), hasEnergy: true };
  }

  function entryComplete(entry) {
    return !!entry && MACRO_KEYS.every((k) => isNonNeg(entry[k]));
  }

  // Fill carbs/fat/fiber on a pre-macro log row. Complete rows are copied through.
  // `food` is the catalog record, or null when that id is gone.
  function migrateEntry(entry, food) {
    if (!entry || typeof entry !== "object") return entry;
    if (entryComplete(entry)) return { ...entry };

    const protein = isNonNeg(entry.protein) ? round1(entry.protein) : null;
    if (!food) {
      return {
        ...entry,
        protein,
        carbs: isNonNeg(entry.carbs) ? round1(entry.carbs) : null,
        fat: isNonNeg(entry.fat) ? round1(entry.fat) : null,
        fiber: isNonNeg(entry.fiber) ? round1(entry.fiber) : null,
      };
    }

    const servings = Number.isFinite(Number(entry.servings)) ? Number(entry.servings) : 1;
    const expected = round1(num(food.protein) * clampServings(servings));
    // More than a rounding crumb away from the stepper math → parent typed grams.
    const typed = protein != null && num(food.protein) > 0 && Math.abs(protein - expected) > 0.2;
    const portion = portionMacros(food, { servings, typedProtein: typed ? protein : null });
    return {
      ...entry,
      servings: portion.servings,
      protein: protein != null ? protein : portion.protein,
      carbs: portion.carbs,
      fat: portion.fat,
      fiber: portion.fiber,
    };
  }

  function migrateDays(days, findFood) {
    if (!days || typeof days !== "object") return {};
    const lookup = typeof findFood === "function" ? findFood : () => null;
    const next = {};
    for (const key of Object.keys(days)) {
      const day = days[key];
      if (!day || typeof day !== "object" || !Array.isArray(day.log)) {
        next[key] = day;
        continue;
      }
      next[key] = {
        ...day,
        log: day.log.map((entry) => {
          try {
            const food = entry && entry.foodId ? lookup(entry.foodId) : null;
            return migrateEntry(entry, food);
          } catch {
            return entry;
          }
        }),
      };
    }
    return next;
  }

  function migrateState(state, findFood) {
    if (!state || typeof state !== "object") return state;
    return { ...state, days: migrateDays(state.days, findFood) };
  }

  // Confirmed rows only. Missing numbers are skipped (not treated as zero) and flagged.
  function confirmedTotals(log) {
    const totals = { protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const unknown = { protein: false, carbs: false, fat: false, fiber: false };
    const list = Array.isArray(log) ? log : [];
    for (const entry of list) {
      if (!entry || !entry.confirmed) continue;
      for (const k of MACRO_KEYS) {
        if (isNonNeg(entry[k])) totals[k] += entry[k];
        else unknown[k] = true;
      }
    }
    for (const k of MACRO_KEYS) totals[k] = round1(totals[k]);
    return { totals, unknown };
  }

  // Catalog sanity check shared by tests. Returns a list of human-readable problems.
  function catalogProblems(foods) {
    const problems = [];
    const ids = new Set();
    const list = Array.isArray(foods) ? foods : [];
    list.forEach((food, index) => {
      const id = food && food.id ? food.id : `#${index}`;
      if (!food || !food.id) {
        problems.push(`${id} missing id`);
        return;
      }
      if (ids.has(food.id)) problems.push(`${id} duplicate id`);
      ids.add(food.id);
      for (const k of MACRO_KEYS) {
        if (!isNonNeg(food[k])) problems.push(`${id} ${k} must be a non-negative number`);
        else if (food[k] > 60) problems.push(`${id} ${k} ${food[k]} is above 60g`);
        else if (Math.abs(food[k] * 10 - Math.round(food[k] * 10)) > 1e-6) {
          problems.push(`${id} ${k} has more than one decimal`);
        }
      }
      if (isNonNeg(food.fiber) && isNonNeg(food.carbs) && food.fiber > food.carbs + 0.5) {
        problems.push(`${id} fiber ${food.fiber} exceeds total carbs ${food.carbs}`);
      }
      const kcal = num(food.protein) * 4 + num(food.carbs) * 4 + num(food.fat) * 9;
      if (kcal < 4 || kcal > 500) problems.push(`${id} calories ${kcal} outside 4–500`);
      if (num(food.protein) === 0 && num(food.carbs) === 0 && num(food.fat) === 0) {
        problems.push(`${id} has no protein, carbs, or fat`);
      }
    });
    return problems;
  }

  return {
    DEFAULT_GOALS,
    MACRO_KEYS,
    KCAL_PER_GRAM,
    round1,
    isNonNeg,
    formatGrams,
    clampServings,
    foodMacros,
    scaleMacros,
    portionMacros,
    macroPercents,
    entryComplete,
    migrateEntry,
    migrateDays,
    migrateState,
    confirmedTotals,
    catalogProblems,
  };
});
