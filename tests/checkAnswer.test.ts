import { describe, expect, it } from "vitest";
import { checkAnswer, UnusableAnswerError } from "../lib/server/checkAnswer";

const good = {
  ingredients: [
    { name: "flour", foodGroup: "grain", saidWords: "a handful", amountKind: "rough", roughWord: "handful", quantity: 1, unit: null },
  ],
  steps: ["Mix it until it comes together."],
  questions: [{ kind: "missing-amount", ingredientName: "salt", text: "How much salt was it?" }],
};

describe("checking Gemini's answer", () => {
  it("accepts an answer in the agreed shape", () => {
    expect(checkAnswer(JSON.stringify(good))).toEqual(good);
  });

  it("refuses text that is not JSON", () => {
    expect(() => checkAnswer("Sure! Here is your recipe")).toThrow(UnusableAnswerError);
  });

  it("refuses an answer with a missing list", () => {
    expect(() => checkAnswer(JSON.stringify({ ingredients: [], steps: [] }))).toThrow(UnusableAnswerError);
  });

  it("refuses an ingredient without a name or with an unknown amountKind", () => {
    const noName = { ...good, ingredients: [{ ...good.ingredients[0], name: " " }] };
    const badKind = { ...good, ingredients: [{ ...good.ingredients[0], amountKind: "guess" }] };
    expect(() => checkAnswer(JSON.stringify(noName))).toThrow(UnusableAnswerError);
    expect(() => checkAnswer(JSON.stringify(badKind))).toThrow(UnusableAnswerError);
  });

  it("files an unknown food group under other", () => {
    const odd = { ...good, ingredients: [{ ...good.ingredients[0], foodGroup: "mystery" }] };
    expect(checkAnswer(JSON.stringify(odd)).ingredients[0].foodGroup).toBe("other");
  });

  it("drops a quantity that is not a positive number", () => {
    const odd = { ...good, ingredients: [{ ...good.ingredients[0], quantity: -3 }] };
    expect(checkAnswer(JSON.stringify(odd)).ingredients[0].quantity).toBeNull();
  });
});
