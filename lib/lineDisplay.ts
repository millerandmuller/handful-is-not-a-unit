// The one rule for what a line shows. The ingredient line on the session screen
// draws only from this, so the screen cannot show something it did not allow:
// an estimate always has its label and mom's own words, and a rough amount with
// no words from mom is a line that needs an answer, never a bare number.

import { formatAmount } from "./measuringTable";
import type { IngredientLine } from "./types";

export interface LineDisplay {
  /** "about ¼ cup", "2 eggs"-style text, or null when the amount is not known yet. */
  amountText: string | null;
  showEstimateLabel: boolean;
  needsAnswer: boolean;
  /** Mom's own words, or null when there are none. */
  saidWords: string | null;
}

export function lineDisplay(line: IngredientLine): LineDisplay {
  const saidWords = line.saidWords.trim() || null;
  const unknown: LineDisplay = { amountText: null, showEstimateLabel: false, needsAnswer: true, saidWords };

  if (!line.amount || line.status === "needs-answer") return unknown;

  if (line.status === "estimate") {
    if (!saidWords) return unknown;
    return { amountText: `about ${formatAmount(line.amount)}`, showEstimateLabel: true, needsAnswer: false, saidWords };
  }

  return { amountText: formatAmount(line.amount), showEstimateLabel: false, needsAnswer: false, saidWords };
}
