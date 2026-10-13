// The rules for what happens to the lines of a session. Pure: each rule takes
// the current lines and returns the new lines. No screen code in here.

import type { Amount, IngredientLine } from "./types";

// Lines that have an amount a person can look at and correct.
const HAS_AMOUNT = new Set(["exact", "estimate", "confirmed", "changed"]);

function sameAmount(a: Amount, b: Amount): boolean {
  return a.unit === b.unit && Math.abs(a.quantity - b.quantity) < 0.0001;
}

function updateLine(lines: IngredientLine[], id: string, change: (line: IngredientLine) => IngredientLine): IngredientLine[] {
  return lines.map((line) => (line.id === id ? change(line) : line));
}

export function addLines(lines: IngredientLine[], added: IngredientLine[]): IngredientLine[] {
  return [...lines, ...added];
}

/** One tap on an estimate: the amount is right. Any other line is left as it is. */
export function confirmLine(lines: IngredientLine[], id: string): IngredientLine[] {
  return updateLine(lines, id, (line) => (line.status === "estimate" ? { ...line, status: "confirmed" } : line));
}

/**
 * Pick a different amount. A line with no amount yet is left alone, because
 * answering a missing amount is a question, not a correction.
 * Picking the amount an estimate already has counts as confirming it.
 */
export function changeAmount(lines: IngredientLine[], id: string, amount: Amount): IngredientLine[] {
  return updateLine(lines, id, (line) => {
    if (!line.amount || !HAS_AMOUNT.has(line.status)) return line;
    if (sameAmount(line.amount, amount)) return confirmLine([line], id)[0];
    return { ...line, amount, status: "changed" };
  });
}

export function removeLine(lines: IngredientLine[], id: string): IngredientLine[] {
  return lines.filter((line) => line.id !== id);
}
