// "The AI reads, the app measures."
// This file is the only place a rough word ("a handful") becomes a number.
// Same words in, same estimate out. No AI in here, so it can be tested.

import type { Amount, HeardIngredient, LineStatus } from "./types";

const TEASPOONS_PER: Record<string, number> = {
  teaspoon: 1,
  tablespoon: 3,
  cup: 48,
};

// The common kitchen amounts, smallest to largest. Used to snap estimates to
// something a real measuring spoon or cup can hold, and for "less" and "more".
export const AMOUNT_LADDER: readonly Amount[] = [
  { quantity: 1 / 8, unit: "teaspoon" },
  { quantity: 1 / 4, unit: "teaspoon" },
  { quantity: 1 / 2, unit: "teaspoon" },
  { quantity: 3 / 4, unit: "teaspoon" },
  { quantity: 1, unit: "teaspoon" },
  { quantity: 1.5, unit: "teaspoon" },
  { quantity: 2, unit: "teaspoon" },
  { quantity: 1, unit: "tablespoon" },
  { quantity: 1.5, unit: "tablespoon" },
  { quantity: 2, unit: "tablespoon" },
  { quantity: 3, unit: "tablespoon" },
  { quantity: 1 / 4, unit: "cup" },
  { quantity: 1 / 3, unit: "cup" },
  { quantity: 1 / 2, unit: "cup" },
  { quantity: 2 / 3, unit: "cup" },
  { quantity: 3 / 4, unit: "cup" },
  { quantity: 1, unit: "cup" },
  { quantity: 1.25, unit: "cup" },
  { quantity: 1.5, unit: "cup" },
  { quantity: 2, unit: "cup" },
  { quantity: 2.5, unit: "cup" },
  { quantity: 3, unit: "cup" },
  { quantity: 4, unit: "cup" },
];

interface RoughEntry {
  words: readonly string[];
  one: Amount;
}

// What one of each rough word is taken to be. These are house estimates, not
// facts about anyone's hand. That is why every one is labeled and correctable.
const ROUGH_WORDS: readonly RoughEntry[] = [
  { words: ["handful", "handfuls", "fistful", "fistfuls"], one: { quantity: 1 / 4, unit: "cup" } },
  { words: ["scoop", "scoops"], one: { quantity: 1 / 4, unit: "cup" } },
  { words: ["pinch", "pinches"], one: { quantity: 1 / 8, unit: "teaspoon" } },
  { words: ["dash", "dashes"], one: { quantity: 1 / 8, unit: "teaspoon" } },
  { words: ["sprinkle", "sprinkles", "sprinkling"], one: { quantity: 1 / 4, unit: "teaspoon" } },
  { words: ["splash", "splashes"], one: { quantity: 1, unit: "tablespoon" } },
  { words: ["drizzle", "drizzles"], one: { quantity: 1, unit: "tablespoon" } },
  { words: ["spoonful", "spoonfuls", "spoonsful", "spoon", "spoons"], one: { quantity: 1, unit: "tablespoon" } },
  { words: ["dollop", "dollops"], one: { quantity: 1, unit: "tablespoon" } },
  { words: ["knob", "knobs"], one: { quantity: 1, unit: "tablespoon" } },
  { words: ["glug", "glugs"], one: { quantity: 2, unit: "tablespoon" } },
  // "approximately a cup", "about a tablespoon": a real unit said roughly.
  { words: ["cup", "cups", "cupful", "cupfuls"], one: { quantity: 1, unit: "cup" } },
  { words: ["tablespoon", "tablespoons", "tbsp"], one: { quantity: 1, unit: "tablespoon" } },
  { words: ["teaspoon", "teaspoons", "tsp"], one: { quantity: 1, unit: "teaspoon" } },
];

const UNIT_NAMES: Record<string, string> = {
  cup: "cup",
  cups: "cup",
  c: "cup",
  tablespoon: "tablespoon",
  tablespoons: "tablespoon",
  tbsp: "tablespoon",
  tbs: "tablespoon",
  teaspoon: "teaspoon",
  teaspoons: "teaspoon",
  tsp: "teaspoon",
};

const FRACTION_GLYPHS: readonly [number, string][] = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
];

const CLOSE_ENOUGH = 0.01;

function inTeaspoons(amount: Amount): number | null {
  const perUnit = TEASPOONS_PER[amount.unit];
  return perUnit === undefined ? null : amount.quantity * perUnit;
}

function nearestRungIndex(teaspoons: number): number {
  let best = 0;
  let bestDistance = Infinity;
  AMOUNT_LADDER.forEach((rung, index) => {
    // Compare on a ratio scale so ⅛ tsp and 4 cups are treated fairly.
    const distance = Math.abs(Math.log(teaspoons / (inTeaspoons(rung) as number)));
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

function isUsableCount(count: number | null | undefined): count is number {
  return typeof count === "number" && Number.isFinite(count) && count > 0;
}

/** The entry for a rough word, however mom happened to say it. */
function findRoughEntry(roughWord: string): RoughEntry | undefined {
  const word = roughWord.trim().toLowerCase();
  return ROUGH_WORDS.find((entry) => entry.words.includes(word));
}

/**
 * The estimate for a rough word, or null when the table has no entry.
 * null means "ask a question". It never means "guess".
 */
export function estimateFor(roughWord: string, count: number = 1): Amount | null {
  const entry = findRoughEntry(roughWord);
  if (!entry) return null;
  if (!isUsableCount(count)) return null;
  const teaspoons = (inTeaspoons(entry.one) as number) * count;
  return AMOUNT_LADDER[nearestRungIndex(teaspoons)];
}

/** "cups" and "tbsp" become "cup" and "tablespoon". Other units are kept as said. */
export function normalizeUnit(unit: string | null): string {
  if (!unit) return "";
  const cleaned = unit.trim().toLowerCase().replace(/\.$/, "");
  return UNIT_NAMES[cleaned] ?? cleaned;
}

export interface Measured {
  amount: Amount | null;
  status: LineStatus;
}

/** Turns what Gemini read into an amount and a status for a new line. */
export function measureHeard(heard: Pick<HeardIngredient, "amountKind" | "roughWord" | "quantity" | "unit" | "saidWords">): Measured {
  const needsAnswer: Measured = { amount: null, status: "needs-answer" };

  if (heard.amountKind === "exact") {
    if (!isUsableCount(heard.quantity)) return needsAnswer;
    return { amount: { quantity: heard.quantity, unit: normalizeUnit(heard.unit) }, status: "exact" };
  }

  if (heard.amountKind === "rough") {
    // An estimate must always be shown next to mom's own words.
    if (!heard.roughWord || !heard.saidWords.trim()) return needsAnswer;
    const amount = estimateFor(heard.roughWord, heard.quantity ?? 1);
    return amount ? { amount, status: "estimate" } : needsAnswer;
  }

  return needsAnswer;
}

/** A few smaller and larger amounts around the given one, smallest first. */
export function nearbyAmounts(amount: Amount, eachSide: number = 3): Amount[] {
  const teaspoons = inTeaspoons(amount);

  if (teaspoons === null) {
    // Counted things (eggs) or other units (grams): step by whole numbers.
    const middle = Math.max(1, Math.round(amount.quantity));
    const options: Amount[] = [];
    for (let quantity = middle - eachSide; quantity <= middle + eachSide; quantity += 1) {
      if (quantity >= 1) options.push({ quantity, unit: amount.unit });
    }
    return options;
  }

  const index = nearestRungIndex(teaspoons);
  const from = Math.max(0, index - eachSide);
  const to = Math.min(AMOUNT_LADDER.length, index + eachSide + 1);
  return AMOUNT_LADDER.slice(from, to);
}

/** 0.25 becomes "¼", 1.5 becomes "1½", 2 becomes "2". */
export function formatQuantity(quantity: number): string {
  const whole = Math.floor(quantity + CLOSE_ENOUGH);
  const rest = quantity - whole;
  if (Math.abs(rest) < CLOSE_ENOUGH) return String(whole);
  const glyph = FRACTION_GLYPHS.find(([value]) => Math.abs(value - rest) < CLOSE_ENOUGH);
  if (!glyph) return String(Math.round(quantity * 100) / 100);
  return whole === 0 ? glyph[1] : `${whole}${glyph[1]}`;
}

/** "¼ cup", "2 cups", "2" (for two eggs). */
export function formatAmount(amount: Amount): string {
  const quantity = formatQuantity(amount.quantity);
  if (!amount.unit) return quantity;
  const isStandardUnit = amount.unit in TEASPOONS_PER;
  const unit = isStandardUnit && amount.quantity > 1 ? `${amount.unit}s` : amount.unit;
  return `${quantity} ${unit}`;
}
