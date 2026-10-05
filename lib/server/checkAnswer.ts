// Checks Gemini's answer before it is returned to the page.
// Anything that does not have the agreed shape is refused, so the page never
// builds an ingredient line out of something unusable.

import { AMOUNT_KINDS, FOOD_GROUPS } from "../types";
import type { AmountKind, FoodGroup, HeardIngredient, HeardQuestion, UnderstandAnswer } from "../types";

export class UnusableAnswerError extends Error {}

const MAX_FIELD_LENGTH = 300;
const QUESTION_KINDS = ["missing-amount", "unclear-ingredient"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string") throw new UnusableAnswerError(`${field} is not text`);
  return value.trim().slice(0, MAX_FIELD_LENGTH);
}

function optionalText(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  const text = requireText(value, field);
  return text === "" ? null : text;
}

function optionalPositiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function requireList(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new UnusableAnswerError(`${field} is not a list`);
  return value;
}

function checkIngredient(value: unknown): HeardIngredient {
  if (!isRecord(value)) throw new UnusableAnswerError("an ingredient is not an object");
  const name = requireText(value.name, "ingredient name");
  if (name === "") throw new UnusableAnswerError("an ingredient has no name");

  const amountKind = value.amountKind;
  if (!AMOUNT_KINDS.includes(amountKind as AmountKind)) {
    throw new UnusableAnswerError("an ingredient has an unknown amountKind");
  }
  const foodGroup = FOOD_GROUPS.includes(value.foodGroup as FoodGroup) ? (value.foodGroup as FoodGroup) : "other";

  return {
    name,
    foodGroup,
    saidWords: requireText(value.saidWords, "saidWords"),
    amountKind: amountKind as AmountKind,
    roughWord: optionalText(value.roughWord, "roughWord"),
    quantity: optionalPositiveNumber(value.quantity),
    unit: optionalText(value.unit, "unit"),
  };
}

function checkQuestion(value: unknown): HeardQuestion {
  if (!isRecord(value)) throw new UnusableAnswerError("a question is not an object");
  const kind = value.kind;
  if (!QUESTION_KINDS.includes(kind as HeardQuestion["kind"])) {
    throw new UnusableAnswerError("a question has an unknown kind");
  }
  const text = requireText(value.text, "question text");
  if (text === "") throw new UnusableAnswerError("a question has no text");
  return { kind: kind as HeardQuestion["kind"], ingredientName: optionalText(value.ingredientName, "ingredientName"), text };
}

/** Parses Gemini's raw text and returns it only if it has the agreed shape. */
export function checkAnswer(rawText: string): UnderstandAnswer {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new UnusableAnswerError("the answer is not JSON");
  }
  if (!isRecord(parsed)) throw new UnusableAnswerError("the answer is not an object");

  return {
    ingredients: requireList(parsed.ingredients, "ingredients").map(checkIngredient),
    steps: requireList(parsed.steps, "steps")
      .map((step) => requireText(step, "step"))
      .filter((step) => step !== ""),
    questions: requireList(parsed.questions, "questions").map(checkQuestion),
  };
}
