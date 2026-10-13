import { describe, expect, it } from "vitest";
import { keepButtonLabel, lineDisplay } from "../lib/lineDisplay";
import { allRoughWords, measureHeard } from "../lib/measuringTable";
import { changeAmount, confirmLine } from "../lib/sessionRules";
import type { IngredientLine } from "../lib/types";

function lineFrom(roughWord: string, saidWords: string): IngredientLine {
  const measured = measureHeard({ amountKind: "rough", roughWord, quantity: 1, unit: null, saidWords });
  return { id: "a", name: "flour", foodGroup: "grain", saidWords, ...measured };
}

describe("what a line shows", () => {
  it("an estimate is never shown without its label and mom's own words", () => {
    const words = allRoughWords();
    expect(words.length).toBeGreaterThan(10);
    for (const word of words) {
      const shown = lineDisplay(lineFrom(word, `a ${word}`));
      expect(shown.showEstimateLabel, word).toBe(true);
      expect(shown.saidWords, word).toBe(`a ${word}`);
      expect(shown.amountText, word).toMatch(/^about /);
    }
  });

  it("a rough amount with no words from mom needs an answer instead of showing a bare number", () => {
    const estimate = lineFrom("handful", "a handful");
    const shown = lineDisplay({ ...estimate, saidWords: "  " });
    expect(shown).toMatchObject({ needsAnswer: true, amountText: null, showEstimateLabel: false });
  });

  it("the label goes away only when the line is confirmed or changed", () => {
    const estimate = lineFrom("handful", "a handful");
    expect(lineDisplay(estimate).showEstimateLabel).toBe(true);

    const [confirmed] = confirmLine([estimate], "a");
    expect(lineDisplay(confirmed)).toMatchObject({ showEstimateLabel: false, amountText: "¼ cup", saidWords: "a handful" });

    const [changed] = changeAmount([estimate], "a", { quantity: 1 / 2, unit: "cup" });
    expect(lineDisplay(changed)).toMatchObject({ showEstimateLabel: false, amountText: "½ cup", saidWords: "a handful" });
  });

  it("an exact amount shows as said, with no label", () => {
    const eggs: IngredientLine = {
      id: "e", name: "eggs", foodGroup: "egg", saidWords: "", amount: { quantity: 2, unit: "" }, status: "exact",
    };
    expect(lineDisplay(eggs)).toMatchObject({ amountText: "2", showEstimateLabel: false, needsAnswer: false, saidWords: null });
  });

  it("a line that needs an answer shows no number", () => {
    const needs: IngredientLine = { id: "n", name: "salt", foodGroup: "spice", saidWords: "just a little bit", amount: null, status: "needs-answer" };
    expect(lineDisplay(needs)).toMatchObject({ needsAnswer: true, amountText: null, showEstimateLabel: false, saidWords: "just a little bit" });
  });

  it("a line kept as mom says shows her words and no number, and is not an estimate", () => {
    const kept: IngredientLine = { id: "k", name: "salt", foodGroup: "spice", saidWords: "just a little bit", amount: null, status: "as-moms-says" };
    expect(lineDisplay(kept)).toEqual({ amountText: null, showEstimateLabel: false, needsAnswer: false, asMomsSays: true, noAmountGiven: false, saidWords: "just a little bit" });
  });

  it("a line kept with no words from mom shows \"no amount given\", not \"as mom says\", and the button says so", () => {
    const kept: IngredientLine = { id: "c", name: "curry", foodGroup: "spice", saidWords: "  ", amount: null, status: "as-moms-says" };
    expect(lineDisplay(kept)).toEqual({ amountText: null, showEstimateLabel: false, needsAnswer: false, asMomsSays: false, noAmountGiven: true, saidWords: null });
    expect(keepButtonLabel({ ...kept, status: "needs-answer" })).toBe("Keep it without an amount");
  });

  it("the button for a line with mom's words reads \"Keep it as mom says\"", () => {
    const waiting: IngredientLine = { id: "s", name: "salt", foodGroup: "spice", saidWords: "some", amount: null, status: "needs-answer" };
    expect(keepButtonLabel(waiting)).toBe("Keep it as mom says");
  });
});
