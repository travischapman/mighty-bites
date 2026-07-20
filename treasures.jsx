// treasures.jsx — collectible treasures unlocked when a NEW food is tried.
// Each: { id, name, emoji, rarity, category }
// Rarities tuned so the kid mostly gets Common/Uncommon, occasional Rare,
// and rare Epic/Legendary. A fresh treasure is drawn on each new-food discovery.

const TREASURE_TINTS = {
  common:    { bg: "#EAF7EE", ring: "#7FD69B", label: "Common",    chance: 50 },
  uncommon:  { bg: "#E4F1FF", ring: "#6FAEF0", label: "Uncommon",  chance: 28 },
  rare:      { bg: "#EEE7FF", ring: "#A589F0", label: "Rare",      chance: 15 },
  epic:      { bg: "#FFE7F1", ring: "#F08AB8", label: "Epic",      chance: 5 },
  legendary: { bg: "#FFF2D6", ring: "#F2B948", label: "Legendary", chance: 2 },
};

const TREASURES = [
  // ── Sea creatures
  { id: 1,  name: "Goldfish",       emoji: "🐠", rarity: "common",    category: "Sea" },
  { id: 2,  name: "Sea Star",       emoji: "⭐", rarity: "common",    category: "Sea" },
  { id: 3,  name: "Crab",           emoji: "🦀", rarity: "common",    category: "Sea" },
  { id: 4,  name: "Tropical Fish",  emoji: "🐟", rarity: "common",    category: "Sea" },
  { id: 5,  name: "Seahorse",       emoji: "🐡", rarity: "uncommon",  category: "Sea" },
  { id: 6,  name: "Octopus",        emoji: "🐙", rarity: "uncommon",  category: "Sea" },
  { id: 7,  name: "Dolphin",        emoji: "🐬", rarity: "uncommon",  category: "Sea" },
  { id: 8,  name: "Shark",          emoji: "🦈", rarity: "rare",      category: "Sea" },
  { id: 9,  name: "Whale",          emoji: "🐳", rarity: "rare",      category: "Sea" },
  { id: 10, name: "Narwhal",        emoji: "🦄", rarity: "epic",      category: "Sea" },
  { id: 11, name: "Kraken",         emoji: "🐙", rarity: "legendary", category: "Sea" },
  { id: 12, name: "Pufferfish",     emoji: "🐡", rarity: "uncommon",  category: "Sea" },
  { id: 13, name: "Jellyfish",      emoji: "🪼", rarity: "uncommon",  category: "Sea" },
  { id: 14, name: "Sea Turtle",     emoji: "🐢", rarity: "rare",      category: "Sea" },
  { id: 15, name: "Coral Reef",     emoji: "🪸", rarity: "rare",      category: "Sea" },

  // ── Land animals
  { id: 16, name: "Bunny",          emoji: "🐰", rarity: "common",    category: "Animals" },
  { id: 17, name: "Puppy",          emoji: "🐶", rarity: "common",    category: "Animals" },
  { id: 18, name: "Kitten",         emoji: "🐱", rarity: "common",    category: "Animals" },
  { id: 19, name: "Hamster",        emoji: "🐹", rarity: "common",    category: "Animals" },
  { id: 20, name: "Hedgehog",       emoji: "🦔", rarity: "uncommon",  category: "Animals" },
  { id: 21, name: "Fox",            emoji: "🦊", rarity: "uncommon",  category: "Animals" },
  { id: 22, name: "Raccoon",        emoji: "🦝", rarity: "uncommon",  category: "Animals" },
  { id: 23, name: "Red Panda",      emoji: "🐼", rarity: "rare",      category: "Animals" },
  { id: 24, name: "Koala",          emoji: "🐨", rarity: "uncommon",  category: "Animals" },
  { id: 25, name: "Sloth",          emoji: "🦥", rarity: "uncommon",  category: "Animals" },
  { id: 26, name: "Tiger",          emoji: "🐯", rarity: "rare",      category: "Animals" },
  { id: 27, name: "Lion",           emoji: "🦁", rarity: "rare",      category: "Animals" },
  { id: 28, name: "Elephant",       emoji: "🐘", rarity: "rare",      category: "Animals" },
  { id: 29, name: "Giraffe",        emoji: "🦒", rarity: "rare",      category: "Animals" },
  { id: 30, name: "Penguin",        emoji: "🐧", rarity: "uncommon",  category: "Animals" },
  { id: 31, name: "Polar Bear",     emoji: "🐻‍❄️", rarity: "rare", category: "Animals" },
  { id: 32, name: "Kangaroo",       emoji: "🦘", rarity: "uncommon",  category: "Animals" },

  // ── Birds + bugs
  { id: 33, name: "Ladybug",        emoji: "🐞", rarity: "common",    category: "Bugs" },
  { id: 34, name: "Butterfly",      emoji: "🦋", rarity: "uncommon",  category: "Bugs" },
  { id: 35, name: "Bumblebee",      emoji: "🐝", rarity: "common",    category: "Bugs" },
  { id: 36, name: "Snail",          emoji: "🐌", rarity: "common",    category: "Bugs" },
  { id: 37, name: "Firefly",        emoji: "✨", rarity: "rare",      category: "Bugs" },
  { id: 38, name: "Owl",            emoji: "🦉", rarity: "uncommon",  category: "Animals" },
  { id: 39, name: "Parrot",         emoji: "🦜", rarity: "uncommon",  category: "Animals" },
  { id: 40, name: "Flamingo",       emoji: "🦩", rarity: "rare",      category: "Animals" },
  { id: 41, name: "Peacock",        emoji: "🦚", rarity: "rare",      category: "Animals" },
  { id: 42, name: "Swan",           emoji: "🦢", rarity: "uncommon",  category: "Animals" },

  // ── Mythical / legendary
  { id: 43, name: "Unicorn",        emoji: "🦄", rarity: "epic",      category: "Mythical" },
  { id: 44, name: "Dragon",         emoji: "🐉", rarity: "legendary", category: "Mythical" },
  { id: 45, name: "Phoenix",        emoji: "🔥", rarity: "epic",      category: "Mythical" },
  { id: 46, name: "Mermaid",        emoji: "🧜", rarity: "epic",      category: "Mythical" },
  { id: 47, name: "Fairy",          emoji: "🧚", rarity: "epic",      category: "Mythical" },
  { id: 48, name: "Wizard",         emoji: "🧙", rarity: "rare",      category: "Mythical" },
  { id: 49, name: "Crystal Ball",   emoji: "🔮", rarity: "rare",      category: "Mythical" },
  { id: 50, name: "Magic Wand",     emoji: "🪄", rarity: "rare",      category: "Mythical" },

  // ── Space
  { id: 51, name: "Star",           emoji: "⭐", rarity: "common",    category: "Space" },
  { id: 52, name: "Crescent Moon",  emoji: "🌙", rarity: "common",    category: "Space" },
  { id: 53, name: "Sun",            emoji: "☀️", rarity: "common", category: "Space" },
  { id: 54, name: "Rainbow",        emoji: "🌈", rarity: "uncommon",  category: "Space" },
  { id: 55, name: "Shooting Star",  emoji: "🌠", rarity: "rare",      category: "Space" },
  { id: 56, name: "Planet",         emoji: "🪐", rarity: "rare",      category: "Space" },
  { id: 57, name: "Rocket Ship",    emoji: "🚀", rarity: "uncommon",  category: "Space" },
  { id: 58, name: "Alien Friend",   emoji: "👽", rarity: "epic",      category: "Space" },
  { id: 59, name: "UFO",            emoji: "🛸", rarity: "epic",      category: "Space" },
  { id: 60, name: "Comet",          emoji: "☄️", rarity: "rare", category: "Space" },

  // ── Treasure / gems
  { id: 61, name: "Gold Coin",      emoji: "🪙", rarity: "common",    category: "Treasure" },
  { id: 62, name: "Ruby",           emoji: "❤️", rarity: "uncommon", category: "Treasure" },
  { id: 63, name: "Emerald",        emoji: "💚", rarity: "uncommon",  category: "Treasure" },
  { id: 64, name: "Sapphire",       emoji: "💙", rarity: "uncommon",  category: "Treasure" },
  { id: 65, name: "Diamond",        emoji: "💎", rarity: "epic",      category: "Treasure" },
  { id: 66, name: "Treasure Chest", emoji: "🧰", rarity: "rare",      category: "Treasure" },
  { id: 67, name: "Crown",          emoji: "👑", rarity: "rare",      category: "Treasure" },
  { id: 68, name: "Pirate Map",     emoji: "🗺️", rarity: "rare", category: "Treasure" },
  { id: 69, name: "Magic Key",      emoji: "🗝️", rarity: "rare", category: "Treasure" },
  { id: 70, name: "Lucky Clover",   emoji: "🍀", rarity: "uncommon",  category: "Treasure" },

  // ── Plants / nature
  { id: 71, name: "Tulip",          emoji: "🌷", rarity: "common",    category: "Plants" },
  { id: 72, name: "Sunflower",      emoji: "🌻", rarity: "common",    category: "Plants" },
  { id: 73, name: "Rose",           emoji: "🌹", rarity: "common",    category: "Plants" },
  { id: 74, name: "Cactus",         emoji: "🌵", rarity: "uncommon",  category: "Plants" },
  { id: 75, name: "Bonsai",         emoji: "🪴", rarity: "uncommon",  category: "Plants" },
  { id: 76, name: "Mushroom",       emoji: "🍄", rarity: "uncommon",  category: "Plants" },
  { id: 77, name: "Maple Leaf",     emoji: "🍁", rarity: "common",    category: "Plants" },
  { id: 78, name: "Palm Tree",      emoji: "🌴", rarity: "uncommon",  category: "Plants" },
  { id: 79, name: "Cherry Blossom", emoji: "🌸", rarity: "rare",      category: "Plants" },

  // ── Weather
  { id: 80, name: "Snowflake",      emoji: "❄️", rarity: "common", category: "Weather" },
  { id: 81, name: "Cloud",          emoji: "☁️", rarity: "common", category: "Weather" },
  { id: 82, name: "Lightning",      emoji: "⚡", rarity: "rare",      category: "Weather" },
  { id: 83, name: "Tornado",        emoji: "🌪️", rarity: "epic", category: "Weather" },
  { id: 84, name: "Volcano",        emoji: "🌋", rarity: "rare",      category: "Weather" },

  // ── Vehicles
  { id: 85, name: "Sailboat",       emoji: "⛵", rarity: "common",    category: "Vehicles" },
  { id: 86, name: "Submarine",      emoji: "🚢", rarity: "uncommon",  category: "Vehicles" },
  { id: 87, name: "Hot Air Balloon",emoji: "🎈", rarity: "uncommon",  category: "Vehicles" },
  { id: 88, name: "Race Car",       emoji: "🏎️", rarity: "uncommon", category: "Vehicles" },
  { id: 89, name: "Train",          emoji: "🚂", rarity: "common",    category: "Vehicles" },
  { id: 90, name: "Helicopter",     emoji: "🚁", rarity: "rare",      category: "Vehicles" },

  // ── Muscle & sport (fits the strong-buddy theme)
  { id: 91, name: "Flexed Arm",     emoji: "💪", rarity: "uncommon",  category: "Strong" },
  { id: 92, name: "Trophy",         emoji: "🏆", rarity: "rare",      category: "Strong" },
  { id: 93, name: "Gold Medal",     emoji: "🥇", rarity: "uncommon",  category: "Strong" },
  { id: 94, name: "Soccer Ball",    emoji: "⚽", rarity: "common",    category: "Strong" },
  { id: 95, name: "Basketball",     emoji: "🏀", rarity: "common",    category: "Strong" },
  { id: 96, name: "Boxing Glove",   emoji: "🥊", rarity: "uncommon",  category: "Strong" },
  { id: 97, name: "Skateboard",     emoji: "🛹", rarity: "uncommon",  category: "Strong" },

  // ── Toys
  { id: 98, name: "Teddy Bear",     emoji: "🧸", rarity: "rare",      category: "Toys" },
  { id: 99, name: "Kite",           emoji: "🪁", rarity: "uncommon",  category: "Toys" },
  { id: 100,name: "Robot",          emoji: "🤖", rarity: "epic",      category: "Toys" },
];

// Rarity-weighted random draw. Returns one treasure object.
function drawTreasure(rng = Math.random) {
  const buckets = {};
  for (const t of TREASURES) (buckets[t.rarity] ||= []).push(t);
  const totalWeight = Object.values(TREASURE_TINTS).reduce((s, r) => s + r.chance, 0);
  let roll = rng() * totalWeight;
  let chosenRarity = "common";
  for (const [rarity, def] of Object.entries(TREASURE_TINTS)) {
    if (roll < def.chance) { chosenRarity = rarity; break; }
    roll -= def.chance;
  }
  const pool = buckets[chosenRarity] || buckets.common;
  return pool[Math.floor(rng() * pool.length)];
}

Object.assign(window, { TREASURES, TREASURE_TINTS, drawTreasure });
