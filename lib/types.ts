// The shapes shared by the page, the helper on the server and the tests.

export const FOOD_GROUPS = [
  "grain",
  "dairy",
  "egg",
  "vegetable",
  "fruit",
  "meat",
  "fish",
  "spice",
  "oil",
  "liquid",
  "sweet",
  "other",
] as const;
export type FoodGroup = (typeof FOOD_GROUPS)[number];

export const AMOUNT_KINDS = ["exact", "rough", "missing"] as const;
export type AmountKind = (typeof AMOUNT_KINDS)[number];

// A measured amount. `unit` is "" for things that are counted ("2 eggs").
export interface Amount {
  quantity: number;
  unit: string;
}

export type LineStatus =
  | "exact" // mom gave a real amount
  | "estimate" // from the measuring table, not yet reviewed
  | "confirmed"
  | "changed"
  | "needs-answer" // no trustworthy amount yet
  | "as-moms-says"; // kept with mom's words and no number; never an estimate

export interface IngredientLine {
  id: string;
  name: string;
  foodGroup: FoodGroup;
  // Exactly what mom said about the amount, for example "a handful".
  saidWords: string;
  amount: Amount | null;
  status: LineStatus;
  photo?: string;
}

export type QuestionKind =
  | "missing-amount"
  | "unknown-rough-word"
  | "unclear-ingredient";

export interface Question {
  id: string;
  kind: QuestionKind;
  text: string;
  lineId?: string;
  answered: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  finishedAt: string;
  mealPhoto?: string;
  ingredients: IngredientLine[];
  steps: string[];
}

// What the helper on the server returns: what Gemini read in mom's words.
// It never contains a converted amount for a rough word. The app measures.
export interface HeardIngredient {
  name: string;
  foodGroup: FoodGroup;
  saidWords: string;
  amountKind: AmountKind;
  // The vague measuring word, for example "handful". Only for `rough`.
  roughWord: string | null;
  // `exact`: the number mom said. `rough`: how many of the rough word ("two handfuls" is 2).
  quantity: number | null;
  // Only for `exact`. null when the ingredient is counted ("two eggs").
  unit: string | null;
}

export interface HeardQuestion {
  kind: "missing-amount" | "unclear-ingredient";
  ingredientName: string | null;
  text: string;
}

export interface UnderstandAnswer {
  ingredients: HeardIngredient[];
  steps: string[];
  questions: HeardQuestion[];
}

export interface UnderstandRequest {
  newText: string;
  knownIngredients: string[];
}

export const MAX_TEXT_LENGTH = 2000;
