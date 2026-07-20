// foods.jsx — the healthy-food database.
// Each food: { id, name, emoji, categories, protein, serving }
//   categories: any of "protein" | "carb" | "fat" (a food can be in several,
//               e.g. an egg is both protein AND healthy fat).
//   protein:    grams of protein in one `serving`.
//   serving:    human-readable portion the protein number refers to.
//
// Protein values use standard reference amounts (USDA-ish, rounded for kids).
// The list is tuned so each category has ~30+ members with deliberate overlaps.

const FOOD_CATEGORIES = [
  { key: "protein", label: "Proteins",     emoji: "💪", blurb: "Builds strong muscles" },
  { key: "carb",    label: "Carbs & Produce", emoji: "🍎", blurb: "Fruits, veggies & energy" },
  { key: "fat",     label: "Healthy Fats", emoji: "🥑", blurb: "Brain & body fuel" },
];

const FOODS = [
  // ── Lean proteins (primary) ────────────────────────────────────────────────
  { id: "chicken_breast", name: "Chicken Breast", emoji: "🍗", categories: ["protein"],            protein: 26,  serving: "3 oz" },
  { id: "turkey_breast",  name: "Turkey Breast",  emoji: "🦃", categories: ["protein"],            protein: 25,  serving: "3 oz" },
  { id: "lean_beef",      name: "Lean Beef",      emoji: "🥩", categories: ["protein"],            protein: 23,  serving: "3 oz" },
  { id: "pork_loin",      name: "Pork Loin",      emoji: "🥓", categories: ["protein"],            protein: 22,  serving: "3 oz" },
  { id: "salmon",         name: "Salmon",         emoji: "🐟", categories: ["protein", "fat"],     protein: 22,  serving: "3 oz" },
  { id: "tuna",           name: "Tuna",           emoji: "🐟", categories: ["protein"],            protein: 20,  serving: "3 oz" },
  { id: "shrimp",         name: "Shrimp",         emoji: "🦐", categories: ["protein"],            protein: 20,  serving: "3 oz" },
  { id: "cod",            name: "Cod",            emoji: "🐠", categories: ["protein"],            protein: 19,  serving: "3 oz" },
  { id: "tilapia",        name: "Tilapia",        emoji: "🐡", categories: ["protein"],            protein: 21,  serving: "3 oz" },
  { id: "sardines",       name: "Sardines",       emoji: "🐟", categories: ["protein", "fat"],     protein: 21,  serving: "3 oz" },
  { id: "egg",            name: "Egg",            emoji: "🥚", categories: ["protein", "fat"],     protein: 6,   serving: "1 large" },
  { id: "egg_whites",     name: "Egg Whites",     emoji: "🍳", categories: ["protein"],            protein: 7,   serving: "2 whites" },
  { id: "greek_yogurt",   name: "Greek Yogurt",   emoji: "🥣", categories: ["protein", "fat"],     protein: 11,  serving: "1/2 cup" },
  { id: "cottage_cheese", name: "Cottage Cheese", emoji: "🧀", categories: ["protein"],            protein: 12,  serving: "1/2 cup" },
  { id: "milk",           name: "Milk",           emoji: "🥛", categories: ["protein", "fat"],     protein: 8,   serving: "1 cup" },
  { id: "string_cheese",  name: "String Cheese",  emoji: "🧀", categories: ["protein", "fat"],     protein: 7,   serving: "1 stick" },
  { id: "tofu",           name: "Tofu",           emoji: "🍥", categories: ["protein", "fat"],     protein: 10,  serving: "1/2 cup" },
  { id: "tempeh",         name: "Tempeh",         emoji: "🫓", categories: ["protein"],            protein: 16,  serving: "3 oz" },
  { id: "seitan",         name: "Seitan",         emoji: "🌾", categories: ["protein"],            protein: 21,  serving: "3 oz" },
  { id: "turkey_jerky",   name: "Turkey Jerky",   emoji: "🥩", categories: ["protein"],            protein: 12,  serving: "1 oz" },
  { id: "ham",            name: "Lean Ham",       emoji: "🍖", categories: ["protein"],            protein: 11,  serving: "2 oz" },
  { id: "edamame",        name: "Edamame",        emoji: "🫛", categories: ["protein", "carb", "fat"], protein: 9, serving: "1/2 cup" },
  { id: "lentils",        name: "Lentils",        emoji: "🫘", categories: ["protein", "carb"],     protein: 9,   serving: "1/2 cup" },
  { id: "black_beans",    name: "Black Beans",    emoji: "🫘", categories: ["protein", "carb"],     protein: 8,   serving: "1/2 cup" },
  { id: "chickpeas",      name: "Chickpeas",      emoji: "🫘", categories: ["protein", "carb"],     protein: 7,   serving: "1/2 cup" },
  { id: "kidney_beans",   name: "Kidney Beans",   emoji: "🫘", categories: ["protein", "carb"],     protein: 7,   serving: "1/2 cup" },
  { id: "green_peas",     name: "Green Peas",     emoji: "🟢", categories: ["protein", "carb"],     protein: 4,   serving: "1/2 cup" },
  { id: "quinoa",         name: "Quinoa",         emoji: "🍚", categories: ["protein", "carb"],     protein: 8,   serving: "1 cup" },
  { id: "peanut_butter",  name: "Peanut Butter",  emoji: "🥜", categories: ["protein", "fat"],      protein: 8,   serving: "2 tbsp" },
  { id: "almonds",        name: "Almonds",        emoji: "🌰", categories: ["protein", "fat"],      protein: 6,   serving: "1 oz" },
  { id: "pumpkin_seeds",  name: "Pumpkin Seeds",  emoji: "🎃", categories: ["protein", "fat"],      protein: 9,   serving: "1 oz" },

  // ── Carbs: fruits, veggies, starches (primary) ─────────────────────────────
  { id: "oats",           name: "Oats",           emoji: "🥣", categories: ["carb"],               protein: 5,   serving: "1/2 cup dry" },
  { id: "brown_rice",     name: "Brown Rice",     emoji: "🍚", categories: ["carb"],               protein: 5,   serving: "1 cup" },
  { id: "wheat_bread",    name: "Whole-Wheat Bread", emoji: "🍞", categories: ["carb"],            protein: 4,   serving: "1 slice" },
  { id: "sweet_potato",   name: "Sweet Potato",   emoji: "🍠", categories: ["carb"],               protein: 2,   serving: "1 medium" },
  { id: "potato",         name: "Potato",         emoji: "🥔", categories: ["carb"],               protein: 3,   serving: "1 medium" },
  { id: "corn",           name: "Corn",           emoji: "🌽", categories: ["carb"],               protein: 3,   serving: "1 ear" },
  { id: "whole_pasta",    name: "Whole-Grain Pasta", emoji: "🍝", categories: ["carb"],            protein: 7,   serving: "1 cup" },
  { id: "tortilla",       name: "Tortilla",       emoji: "🌯", categories: ["carb"],               protein: 4,   serving: "1 tortilla" },
  { id: "popcorn",        name: "Popcorn",        emoji: "🍿", categories: ["carb"],               protein: 3,   serving: "3 cups" },
  { id: "banana",         name: "Banana",         emoji: "🍌", categories: ["carb"],               protein: 1,   serving: "1 medium" },
  { id: "apple",          name: "Apple",          emoji: "🍎", categories: ["carb"],               protein: 0.5, serving: "1 medium" },
  { id: "orange",         name: "Orange",         emoji: "🍊", categories: ["carb"],               protein: 1,   serving: "1 medium" },
  { id: "strawberries",   name: "Strawberries",   emoji: "🍓", categories: ["carb"],               protein: 1,   serving: "1 cup" },
  { id: "blueberries",    name: "Blueberries",    emoji: "🫐", categories: ["carb"],               protein: 1,   serving: "1 cup" },
  { id: "grapes",         name: "Grapes",         emoji: "🍇", categories: ["carb"],               protein: 1,   serving: "1 cup" },
  { id: "mango",          name: "Mango",          emoji: "🥭", categories: ["carb"],               protein: 1,   serving: "1 cup" },
  { id: "watermelon",     name: "Watermelon",     emoji: "🍉", categories: ["carb"],               protein: 1,   serving: "1 cup" },
  { id: "pineapple",      name: "Pineapple",      emoji: "🍍", categories: ["carb"],               protein: 1,   serving: "1 cup" },
  { id: "pear",           name: "Pear",           emoji: "🍐", categories: ["carb"],               protein: 1,   serving: "1 medium" },
  { id: "peach",          name: "Peach",          emoji: "🍑", categories: ["carb"],               protein: 1,   serving: "1 medium" },
  { id: "carrots",        name: "Carrots",        emoji: "🥕", categories: ["carb"],               protein: 1,   serving: "1 cup" },
  { id: "broccoli",       name: "Broccoli",       emoji: "🥦", categories: ["carb"],               protein: 3,   serving: "1 cup" },
  { id: "spinach",        name: "Spinach",        emoji: "🥬", categories: ["carb"],               protein: 1,   serving: "1 cup raw" },
  { id: "bell_pepper",    name: "Bell Pepper",    emoji: "🫑", categories: ["carb"],               protein: 1,   serving: "1 medium" },
  { id: "tomato",         name: "Tomato",         emoji: "🍅", categories: ["carb"],               protein: 1,   serving: "1 medium" },
  { id: "cucumber",       name: "Cucumber",       emoji: "🥒", categories: ["carb"],               protein: 1,   serving: "1 cup" },
  { id: "green_beans",    name: "Green Beans",    emoji: "🫛", categories: ["carb"],               protein: 2,   serving: "1 cup" },
  { id: "squash",         name: "Butternut Squash", emoji: "🎃", categories: ["carb"],             protein: 2,   serving: "1 cup" },
  { id: "mushrooms",      name: "Mushrooms",      emoji: "🍄", categories: ["carb"],               protein: 3,   serving: "1 cup" },

  // ── Healthy fats (primary) ─────────────────────────────────────────────────
  { id: "avocado",        name: "Avocado",        emoji: "🥑", categories: ["fat", "carb"],         protein: 2,   serving: "1/2 fruit" },
  { id: "olive_oil",      name: "Olive Oil",      emoji: "🫒", categories: ["fat"],                protein: 0,   serving: "1 tbsp" },
  { id: "walnuts",        name: "Walnuts",        emoji: "🌰", categories: ["fat", "protein"],      protein: 4,   serving: "1 oz" },
  { id: "cashews",        name: "Cashews",        emoji: "🥜", categories: ["fat", "protein"],      protein: 5,   serving: "1 oz" },
  { id: "pecans",         name: "Pecans",         emoji: "🌰", categories: ["fat"],                protein: 3,   serving: "1 oz" },
  { id: "almond_butter",  name: "Almond Butter",  emoji: "🥜", categories: ["fat", "protein"],      protein: 7,   serving: "2 tbsp" },
  { id: "chia_seeds",     name: "Chia Seeds",     emoji: "🌱", categories: ["fat", "protein"],      protein: 5,   serving: "2 tbsp" },
  { id: "flax_seeds",     name: "Flax Seeds",     emoji: "🌾", categories: ["fat", "protein"],      protein: 4,   serving: "2 tbsp" },
  { id: "sunflower_seeds",name: "Sunflower Seeds",emoji: "🌻", categories: ["fat", "protein"],      protein: 6,   serving: "1 oz" },
  { id: "tahini",         name: "Tahini",         emoji: "🥣", categories: ["fat", "protein"],      protein: 5,   serving: "2 tbsp" },
  { id: "cheddar",        name: "Cheddar Cheese", emoji: "🧀", categories: ["fat", "protein"],      protein: 7,   serving: "1 oz" },
  { id: "feta",           name: "Feta Cheese",    emoji: "🧀", categories: ["fat", "protein"],      protein: 4,   serving: "1 oz" },
  { id: "mozzarella",     name: "Mozzarella",     emoji: "🧀", categories: ["fat", "protein"],      protein: 6,   serving: "1 oz" },
  { id: "olives",         name: "Olives",         emoji: "🫒", categories: ["fat"],                protein: 1,   serving: "10 olives" },
  { id: "dark_chocolate", name: "Dark Chocolate", emoji: "🍫", categories: ["fat"],                protein: 2,   serving: "1 oz" },
  { id: "coconut",        name: "Coconut",        emoji: "🥥", categories: ["fat"],                protein: 2,   serving: "1/2 cup" },
  { id: "hummus",         name: "Hummus",         emoji: "🥣", categories: ["fat", "protein", "carb"], protein: 2, serving: "2 tbsp" },
  { id: "guacamole",      name: "Guacamole",      emoji: "🥑", categories: ["fat", "carb"],         protein: 1,   serving: "1/4 cup" },
  { id: "pesto",          name: "Pesto",          emoji: "🌿", categories: ["fat"],                protein: 2,   serving: "2 tbsp" },
];

const _FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]));
const getFood = (id) => _FOOD_BY_ID[id];
const foodsByCategory = (cat) => FOODS.filter((f) => f.categories.includes(cat));
const foodCountForCategory = (cat) => foodsByCategory(cat).length;

Object.assign(window, {
  FOODS, FOOD_CATEGORIES, getFood, foodsByCategory, foodCountForCategory,
});
