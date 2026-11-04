// Nutrition math, catalog checks, and old-save migration.
// Run from the repo root: node --test
// foods.jsx is plain JavaScript (no JSX syntax). Node won't require() a .jsx
// file, so the test evaluates it in a sandbox — the shipped app still has no build.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const nutrition = require("../nutrition.js");
const {
  round1, portionMacros, scaleMacros, macroPercents, confirmedTotals,
  migrateEntry, migrateState, catalogProblems, formatGrams,
} = nutrition;

function loadFoods() {
  const filename = path.join(__dirname, "..", "foods.jsx");
  const code = fs.readFileSync(filename, "utf8");
  const sandbox = {
    window: {},
    console,
    Object,
    Math,
    module: { exports: {} },
  };
  sandbox.exports = sandbox.module.exports;
  sandbox.globalThis = sandbox;
  vm.runInNewContext(code, sandbox, { filename });
  return sandbox.module.exports;
}

const foods = loadFoods();
const { FOODS, findFood } = foods;
const byId = Object.fromEntries(FOODS.map((f) => [f.id, f]));

// Protein grams shipped before macros existed. Kept on purpose.
const ORIGINAL_PROTEIN = {
  chicken_breast: 26, turkey_breast: 25, lean_beef: 23, pork_loin: 22, salmon: 22,
  tuna: 20, shrimp: 20, cod: 19, tilapia: 21, sardines: 21, egg: 6, egg_whites: 7,
  greek_yogurt: 11, cottage_cheese: 12, milk: 8, string_cheese: 7, tofu: 10,
  tempeh: 16, seitan: 21, turkey_jerky: 12, ham: 11, edamame: 9, lentils: 9,
  black_beans: 8, chickpeas: 7, kidney_beans: 7, green_peas: 4, quinoa: 8,
  peanut_butter: 8, almonds: 6, pumpkin_seeds: 9, oats: 5, brown_rice: 5,
  wheat_bread: 4, sweet_potato: 2, potato: 3, corn: 3, whole_pasta: 7, tortilla: 4,
  popcorn: 3, banana: 1, apple: 0.5, orange: 1, strawberries: 1, blueberries: 1,
  grapes: 1, mango: 1, watermelon: 1, pineapple: 1, pear: 1, peach: 1, carrots: 1,
  broccoli: 3, spinach: 1, bell_pepper: 1, tomato: 1, cucumber: 1, green_beans: 2,
  squash: 2, mushrooms: 3, avocado: 2, olive_oil: 0, walnuts: 4, cashews: 5,
  pecans: 3, almond_butter: 7, chia_seeds: 5, flax_seeds: 4, sunflower_seeds: 6,
  tahini: 5, cheddar: 7, feta: 4, mozzarella: 6, olives: 1, dark_chocolate: 2,
  coconut: 2, hummus: 2, guacamole: 1, pesto: 2,
};

test("catalog has every food's macros in a sane range and keeps protein", () => {
  assert.equal(FOODS.length, 79);
  assert.equal(Object.keys(ORIGINAL_PROTEIN).length, 79);
  const problems = catalogProblems(FOODS);
  assert.deepEqual(problems, [], problems.join("\n"));
  for (const food of FOODS) {
    assert.equal(food.protein, ORIGINAL_PROTEIN[food.id], `${food.id} protein changed`);
    for (const key of ["protein", "carbs", "fat", "fiber"]) {
      assert.equal(typeof food[key], "number", food.id);
      assert.ok(food[key] >= 0, food.id);
    }
    assert.ok(Array.isArray(food.categories) && food.categories.length > 0, food.id);
    for (const cat of food.categories) assert.ok(["protein", "carb", "fat"].includes(cat), food.id);
    assert.equal(findFood(food.id), food);
  }
  assert.equal(findFood("not_a_food"), null);
  assert.equal(catalogProblems([{ id: "bad", protein: -1, carbs: 1, fat: 0, fiber: 0 }]).length > 0, true);
});

test("quarter servings and typed protein grams scale every macro together", () => {
  const chicken = byId.chicken_breast;
  assert.deepEqual(portionMacros(chicken, { servings: 0.25 }), {
    servings: 0.25, protein: 6.5, carbs: 0, fat: 0.8, fiber: 0,
  });
  assert.deepEqual(portionMacros(chicken, { servings: 1.5 }), {
    servings: 1.5, protein: 39, carbs: 0, fat: 4.5, fiber: 0,
  });
  assert.deepEqual(portionMacros(chicken, { servings: 0 }), {
    servings: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
  });

  // Half a banana: protein 0.5, carbs 13.5, fiber 1.5.
  const banana = byId.banana;
  assert.deepEqual(scaleMacros(banana, 0.5), { protein: 0.5, carbs: 13.5, fat: 0, fiber: 1.5 });

  // Typed 13g protein is half a chicken serving → half the fat too.
  assert.deepEqual(portionMacros(chicken, { servings: 1, typedProtein: 13 }), {
    servings: 0.5, protein: 13, carbs: 0, fat: 1.5, fiber: 0,
  });

  // Typed 10g is not a tidy fraction. Fat follows 10/26, servings label is 1 decimal.
  const ten = portionMacros(chicken, { servings: 2, typedProtein: 10 });
  assert.equal(ten.protein, 10);
  assert.equal(ten.fat, round1(3 * (10 / 26)));
  assert.equal(ten.carbs, 0);
  assert.equal(ten.fiber, 0);
  assert.equal(ten.servings, round1(10 / 26));

  // Apple protein is 0.5g. Typing 0.2g is 40% of the fruit.
  const apple = portionMacros(byId.apple, { servings: 1, typedProtein: 0.2 });
  assert.equal(apple.protein, 0.2);
  assert.equal(apple.carbs, 10);
  assert.equal(apple.fiber, 1.6);
  assert.equal(apple.servings, 0.4);

  // Typing 0g clears the other macros when the food has protein.
  assert.deepEqual(portionMacros(chicken, { servings: 1, typedProtein: 0 }), {
    servings: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
  });

  // Olive oil has no protein, so a typed protein can't pick the portion.
  // Two stepper servings still mean 28g fat; the typed 4g protein is stored as-is.
  assert.deepEqual(portionMacros(byId.olive_oil, { servings: 2, typedProtein: 4 }), {
    servings: 2, protein: 4, carbs: 0, fat: 28, fiber: 0,
  });
  assert.deepEqual(portionMacros(byId.olive_oil, { servings: 0.5 }), {
    servings: 0.5, protein: 0, carbs: 0, fat: 7, fiber: 0,
  });

  // Typed grams above the sheet's 200g cap clamp, and junk servings don't throw.
  const capped = portionMacros(chicken, { servings: -3, typedProtein: 500 });
  assert.equal(capped.protein, 200);
  assert.ok(capped.fat > 0);
  assert.deepEqual(portionMacros(null, { servings: "nope" }), {
    servings: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
  });
});

test("confirmed foods add every macro; pending foods do not", () => {
  const log = [
    { confirmed: true, protein: 6.5, carbs: 0, fat: 0.8, fiber: 0 },
    { confirmed: true, protein: 1, carbs: 27, fat: 0, fiber: 3 },
    { confirmed: false, protein: 100, carbs: 100, fat: 100, fiber: 100 },
  ];
  assert.deepEqual(confirmedTotals(log), {
    totals: { protein: 7.5, carbs: 27, fat: 0.8, fiber: 3 },
    unknown: { protein: false, carbs: false, fat: false, fiber: false },
  });

  const mixed = confirmedTotals([
    { confirmed: true, protein: 10, carbs: null, fat: null, fiber: null },
    { confirmed: true, protein: 5, carbs: 2, fat: 1, fiber: 1 },
    null,
  ]);
  assert.deepEqual(mixed.totals, { protein: 15, carbs: 2, fat: 1, fiber: 1 });
  assert.equal(mixed.unknown.protein, false);
  assert.equal(mixed.unknown.carbs, true);
  assert.equal(mixed.unknown.fat, true);
  assert.equal(mixed.unknown.fiber, true);
  assert.deepEqual(confirmedTotals(null).totals, { protein: 0, carbs: 0, fat: 0, fiber: 0 });
});

test("calorie percents are integers, sum to 100, and ignore fiber", () => {
  const chicken = macroPercents(byId.chicken_breast);
  assert.equal(chicken.protein + chicken.carbs + chicken.fat, 100);
  assert.equal(chicken.carbs, 0);
  assert.ok(chicken.protein > chicken.fat);
  assert.equal(chicken.hasEnergy, true);

  const oil = macroPercents(byId.olive_oil);
  assert.deepEqual(
    { protein: oil.protein, carbs: oil.carbs, fat: oil.fat },
    { protein: 0, carbs: 0, fat: 100 },
  );

  // 9g protein, 9g carbs, 4g fat → 36 kcal each. One leftover point goes to protein.
  const thirds = macroPercents({ protein: 9, carbs: 9, fat: 4, fiber: 99 });
  assert.deepEqual(
    { protein: thirds.protein, carbs: thirds.carbs, fat: thirds.fat },
    { protein: 34, carbs: 33, fat: 33 },
  );
  assert.equal(thirds.fiber, 99);
  const noFiber = macroPercents({ protein: 9, carbs: 9, fat: 4, fiber: 0 });
  assert.equal(noFiber.protein, thirds.protein);
  assert.equal(noFiber.carbs, thirds.carbs);
  assert.equal(noFiber.fat, thirds.fat);

  const empty = macroPercents({ protein: 0, carbs: 0, fat: 0, fiber: 5 });
  assert.deepEqual(
    { protein: empty.protein, carbs: empty.carbs, fat: empty.fat, hasEnergy: empty.hasEnergy },
    { protein: 0, carbs: 0, fat: 0, hasEnergy: false },
  );
  assert.equal(empty.protein + empty.carbs + empty.fat, 0);
  assert.equal(empty.fiber, 5);
  assert.equal(macroPercents(null).hasEnergy, false);

  for (const food of FOODS) {
    const pct = macroPercents(food);
    assert.equal(pct.protein + pct.carbs + pct.fat, 100, food.id);
    for (const key of ["protein", "carbs", "fat"]) {
      assert.equal(pct[key], Math.round(pct[key]), food.id);
      assert.ok(pct[key] >= 0 && pct[key] <= 100, food.id);
    }
    assert.equal(pct.fiber, food.fiber, food.id);
    assert.equal(pct.hasEnergy, true, food.id);
  }
});

test("old mighty.v1 logs backfill from the catalog and never crash", () => {
  const saved = {
    days: {
      "2026-01-01": {
        goalCelebrated: true,
        log: [
          { id: "egg2", foodId: "egg", servings: 2, protein: 12, confirmed: true, ts: 1 },
          { id: "ban", foodId: "banana", servings: 1, protein: 1, confirmed: false, ts: 2 },
          { id: "half", foodId: "chicken_breast", servings: 1, protein: 13, confirmed: true, ts: 3 },
          { id: "gone", foodId: "mystery_stew", servings: 1, protein: 10, confirmed: true, ts: 4 },
          { id: "kept", foodId: "oats", servings: 1, protein: 5, carbs: 27, fat: 3, fiber: 4, confirmed: true, note: "already new" },
          { id: "oil", foodId: "olive_oil", servings: 1, protein: 4, confirmed: true, ts: 5 },
          null,
        ],
      },
      "2026-01-02": { goalCelebrated: false },
    },
    triedFoods: { egg: { firstTriedKey: "2026-01-01" } },
    treasures: [{ uid: "t1" }],
    tournament: { wins: 2, awards: [{ id: "champion" }], lastPlayedDay: "2026-01-01" },
  };
  const original = JSON.parse(JSON.stringify(saved));
  const migrated = migrateState(saved, findFood);

  assert.deepEqual(saved, original, "migration must not mutate the saved object");
  assert.deepEqual(migrated.triedFoods, saved.triedFoods);
  assert.deepEqual(migrated.treasures, saved.treasures);
  assert.deepEqual(migrated.tournament, saved.tournament);
  assert.equal(migrated.days["2026-01-01"].goalCelebrated, true);
  assert.deepEqual(migrated.days["2026-01-02"], { goalCelebrated: false });

  const log = migrated.days["2026-01-01"].log;
  assert.deepEqual(
    { protein: log[0].protein, carbs: log[0].carbs, fat: log[0].fat, fiber: log[0].fiber, servings: log[0].servings },
    { protein: 12, carbs: 1, fat: 10, fiber: 0, servings: 2 },
  );
  assert.equal(log[1].carbs, 27);
  assert.equal(log[1].fiber, 3);
  assert.equal(log[1].confirmed, false);
  assert.deepEqual(
    { protein: log[2].protein, carbs: log[2].carbs, fat: log[2].fat, fiber: log[2].fiber },
    { protein: 13, carbs: 0, fat: 1.5, fiber: 0 },
  );
  assert.equal(log[3].protein, 10);
  assert.equal(log[3].carbs, null);
  assert.equal(log[3].fat, null);
  assert.equal(log[3].fiber, null);
  assert.equal(log[4].note, "already new");
  assert.equal(log[4].carbs, 27);
  // Olive oil's typed protein can't be inverted; fat stays one serving.
  assert.deepEqual(
    { protein: log[5].protein, fat: log[5].fat, carbs: log[5].carbs, fiber: log[5].fiber },
    { protein: 4, fat: 14, carbs: 0, fiber: 0 },
  );
  assert.equal(log[6], null);

  const totals = confirmedTotals(log);
  assert.equal(totals.unknown.carbs, true);
  assert.ok(totals.totals.protein > 0);

  assert.deepEqual(migrateState(migrateState(saved, findFood), findFood), migrated);
  assert.equal(migrateState(null, findFood), null);
  assert.deepEqual(migrateState({ tournament: { wins: 1 } }, findFood), { tournament: { wins: 1 }, days: {} });
  assert.equal(migrateEntry(null, null), null);
  assert.equal(migrateEntry(4, byId.egg), 4);
  assert.equal(formatGrams(null), "—");
  assert.equal(formatGrams(1.5), "1.5");
  assert.equal(formatGrams(2), "2");
});
