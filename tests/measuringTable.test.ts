import { describe, expect, it } from "vitest";
import {
  AMOUNT_LADDER,
  estimateFor,
  formatAmount,
  formatQuantity,
  measureHeard,
  nearbyAmounts,
  normalizeUnit,
} from "../lib/measuringTable";

describe("rough words become estimates", () => {
  it("a handful is a quarter cup", () => {
    expect(estimateFor("handful")).toEqual({ quantity: 1 / 4, unit: "cup" });
  });

  it("gives the same estimate for the same word every time, however it is written", () => {
    expect(estimateFor("Handful")).toEqual(estimateFor("handful"));
    expect(estimateFor(" handfuls ")).toEqual(estimateFor("handful"));
  });

  it("knows the everyday rough words", () => {
    for (const word of ["handful", "pinch", "dash", "splash", "scoop", "spoonful", "sprinkle", "drizzle", "dollop", "knob", "glug"]) {
      expect(estimateFor(word), word).not.toBeNull();
    }
  });

  it("two handfuls is half a cup", () => {
    expect(estimateFor("handful", 2)).toEqual({ quantity: 1 / 2, unit: "cup" });
  });

  it("approximately a cup is one cup", () => {
    expect(estimateFor("cup")).toEqual({ quantity: 1, unit: "cup" });
  });

  it("always lands on an amount from the ladder", () => {
    for (const count of [1, 2, 3, 5, 7]) {
      expect(AMOUNT_LADDER).toContainEqual(estimateFor("pinch", count));
    }
  });

  it("returns nothing for a word it does not know, so the app can ask instead of guessing", () => {
    expect(estimateFor("smidgen")).toBeNull();
    expect(estimateFor("")).toBeNull();
  });

  it("returns nothing for a count that makes no sense", () => {
    expect(estimateFor("handful", 0)).toBeNull();
    expect(estimateFor("handful", Number.NaN)).toBeNull();
  });
});

describe("measuring what was heard", () => {
  const rough = { amountKind: "rough" as const, roughWord: "handful", quantity: 1, unit: null, saidWords: "a handful" };

  it("a handful of flour is an estimate", () => {
    expect(measureHeard(rough)).toEqual({ amount: { quantity: 1 / 4, unit: "cup" }, status: "estimate" });
  });

  it("two eggs is exact and counted", () => {
    const heard = { amountKind: "exact" as const, roughWord: null, quantity: 2, unit: null, saidWords: "two" };
    expect(measureHeard(heard)).toEqual({ amount: { quantity: 2, unit: "" }, status: "exact" });
  });

  it("one cup of milk is exact with a unit", () => {
    const heard = { amountKind: "exact" as const, roughWord: null, quantity: 1, unit: "cups", saidWords: "one cup" };
    expect(measureHeard(heard)).toEqual({ amount: { quantity: 1, unit: "cup" }, status: "exact" });
  });

  it("an unknown rough word needs an answer and gets no number", () => {
    expect(measureHeard({ ...rough, roughWord: "smidgen", saidWords: "a smidgen" })).toEqual({ amount: null, status: "needs-answer" });
  });

  it("a missing amount needs an answer and gets no number", () => {
    const heard = { amountKind: "missing" as const, roughWord: null, quantity: null, unit: null, saidWords: "" };
    expect(measureHeard(heard)).toEqual({ amount: null, status: "needs-answer" });
  });

  it("a rough amount without mom's words is not turned into an estimate", () => {
    expect(measureHeard({ ...rough, saidWords: "  " })).toEqual({ amount: null, status: "needs-answer" });
  });

  it("an exact amount without a number needs an answer", () => {
    const heard = { amountKind: "exact" as const, roughWord: null, quantity: null, unit: "cup", saidWords: "a cup" };
    expect(measureHeard(heard).status).toBe("needs-answer");
  });
});

describe("the ladder of nearby amounts", () => {
  it("is ordered from smallest to largest", () => {
    const teaspoons = AMOUNT_LADDER.map((rung) => rung.quantity * { teaspoon: 1, tablespoon: 3, cup: 48 }[rung.unit as "cup"]);
    expect([...teaspoons].sort((a, b) => a - b)).toEqual(teaspoons);
  });

  it("offers smaller and larger amounts around a quarter cup", () => {
    const labels = nearbyAmounts({ quantity: 1 / 4, unit: "cup" }).map(formatAmount);
    expect(labels).toEqual(["1½ tablespoons", "2 tablespoons", "3 tablespoons", "¼ cup", "⅓ cup", "½ cup", "⅔ cup"]);
  });

  it("stops at the ends of the ladder", () => {
    expect(nearbyAmounts({ quantity: 1 / 8, unit: "teaspoon" })[0]).toEqual({ quantity: 1 / 8, unit: "teaspoon" });
    expect(nearbyAmounts({ quantity: 4, unit: "cup" }).at(-1)).toEqual({ quantity: 4, unit: "cup" });
  });

  it("steps counted things by whole numbers and never below one", () => {
    expect(nearbyAmounts({ quantity: 2, unit: "" }).map((a) => a.quantity)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("writing amounts", () => {
  it("writes fractions the way a recipe card does", () => {
    expect(formatQuantity(0.25)).toBe("¼");
    expect(formatQuantity(1 / 3)).toBe("⅓");
    expect(formatQuantity(1.5)).toBe("1½");
    expect(formatQuantity(2)).toBe("2");
  });

  it("writes units in singular and plural", () => {
    expect(formatAmount({ quantity: 1 / 4, unit: "cup" })).toBe("¼ cup");
    expect(formatAmount({ quantity: 2, unit: "cup" })).toBe("2 cups");
    expect(formatAmount({ quantity: 1.5, unit: "tablespoon" })).toBe("1½ tablespoons");
    expect(formatAmount({ quantity: 2, unit: "" })).toBe("2");
  });

  it("normalizes short unit names", () => {
    expect(normalizeUnit("Tbsp.")).toBe("tablespoon");
    expect(normalizeUnit("cups")).toBe("cup");
    expect(normalizeUnit("grams")).toBe("grams");
    expect(normalizeUnit(null)).toBe("");
  });
});
