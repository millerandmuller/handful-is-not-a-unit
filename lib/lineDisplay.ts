// The one rule for what a line shows. The ingredient line on the session screen
// draws only from this, so the screen cannot show something it did not allow:
// an estimate always has its label and mom's own words, and a rough amount with
// no words from mom is a line that needs an answer, never a bare number.

import { formatAmount } from "./measuringTable";
import type { IngredientLine } from "./types";

export interface LineDisplay {
  /** "about ¼ cup", "2" or "¼ cup", or null when there is no number to show. */
  amountText: string | null;
  showEstimateLabel: boolean;
  needsAnswer: boolean;
  /** Kept "as mom says": no number, not an estimate, and mom's words are there to point to. */
  asMomsSays: boolean;
  /** Kept without an amount and mom gave no words at all, so there is nothing to point to. */
  noAmountGiven: boolean;
  /** Mom's own words, or null when there are none. */
  saidWords: string | null;
}

export function lineDisplay(line: IngredientLine): LineDisplay {
  const saidWords = line.saidWords.trim() || null;
  const unknown: LineDisplay = { amountText: null, showEstimateLabel: false, needsAnswer: true, asMomsSays: false, noAmountGiven: false, saidWords };

  if (line.status === "as-moms-says") {
    // "As mom says" only makes sense when she said something to point to.
    return { ...unknown, needsAnswer: false, asMomsSays: saidWords !== null, noAmountGiven: saidWords === null };
  }

  if (!line.amount || line.status === "needs-answer") return unknown;

  if (line.status === "estimate") {
    if (!saidWords) return unknown;
    return { amountText: `about ${formatAmount(line.amount)}`, showEstimateLabel: true, needsAnswer: false, asMomsSays: false, noAmountGiven: false, saidWords };
  }

  return { amountText: formatAmount(line.amount), showEstimateLabel: false, needsAnswer: false, asMomsSays: false, noAmountGiven: false, saidWords };
}

/** The button for keeping a line that has no amount: its wording depends on whether mom said anything. */
export function keepButtonLabel(line: IngredientLine): string {
  return line.saidWords.trim() ? "Keep it as mom says" : "Keep it without an amount";
}
