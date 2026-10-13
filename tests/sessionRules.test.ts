import { describe, expect, it } from "vitest";
import {
  addLines,
  answerQuestion,
  answerWithAmount,
  attachPhoto,
  changeAmount,
  confirmLine,
  hasNothingToFinish,
  keepAsMomsSays,
  leftovers,
  openQuestions,
  questionsFromReading,
  removeLine,
} from "../lib/sessionRules";
import type { IngredientLine } from "../lib/types";

function line(over: Partial<IngredientLine>): IngredientLine {
  return {
    id: "a",
    name: "flour",
    foodGroup: "grain",
    saidWords: "a handful",
    amount: { quantity: 1 / 4, unit: "cup" },
    status: "estimate",
    ...over,
  };
}

describe("adding lines", () => {
  it("puts new lines after the ones already there, without changing the old list", () => {
    const before = [line({ id: "a" })];
    const after = addLines(before, [line({ id: "b" })]);
    expect(after.map((l) => l.id)).toEqual(["a", "b"]);
    expect(before).toHaveLength(1);
  });
});

describe("confirming", () => {
  it("turns an estimate into a confirmed line and keeps the amount and mom's words", () => {
    const [confirmed] = confirmLine([line({})], "a");
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.amount).toEqual({ quantity: 1 / 4, unit: "cup" });
    expect(confirmed.saidWords).toBe("a handful");
  });

  it("only touches the line that was tapped", () => {
    const result = confirmLine([line({ id: "a" }), line({ id: "b" })], "b");
    expect(result.map((l) => l.status)).toEqual(["estimate", "confirmed"]);
  });

  it("leaves exact lines and lines that need an answer alone", () => {
    const exact = line({ id: "e", status: "exact", saidWords: "" });
    const needs = line({ id: "n", status: "needs-answer", amount: null });
    expect(confirmLine([exact, needs], "e")[0]).toBe(exact);
    expect(confirmLine([exact, needs], "n")[1]).toBe(needs);
  });
});

describe("changing the amount", () => {
  it("sets the new amount and marks the line as changed", () => {
    const [changed] = changeAmount([line({})], "a", { quantity: 1 / 2, unit: "cup" });
    expect(changed.amount).toEqual({ quantity: 1 / 2, unit: "cup" });
    expect(changed.status).toBe("changed");
    expect(changed.saidWords).toBe("a handful");
  });

  it("picking the amount an estimate already has confirms it", () => {
    const [result] = changeAmount([line({})], "a", { quantity: 1 / 4, unit: "cup" });
    expect(result.status).toBe("confirmed");
  });

  it("works on an exact line too", () => {
    const eggs = line({ id: "e", name: "eggs", status: "exact", saidWords: "", amount: { quantity: 2, unit: "" } });
    const [changed] = changeAmount([eggs], "e", { quantity: 3, unit: "" });
    expect(changed).toMatchObject({ status: "changed", amount: { quantity: 3, unit: "" } });
  });

  it("does not invent an amount for a line that has none", () => {
    const needs = line({ status: "needs-answer", amount: null });
    expect(changeAmount([needs], "a", { quantity: 1, unit: "cup" })[0]).toBe(needs);
  });
});

describe("removing", () => {
  it("takes the line out and keeps the others in order", () => {
    const result = removeLine([line({ id: "a" }), line({ id: "b" }), line({ id: "c" })], "b");
    expect(result.map((l) => l.id)).toEqual(["a", "c"]);
  });

  it("does nothing for an id that is not there", () => {
    expect(removeLine([line({ id: "a" })], "zzz")).toHaveLength(1);
  });
});

describe("questions", () => {
  it("an ingredient said with no amount becomes a question, never an invented amount", () => {
    const salt = line({ id: "s", name: "salt", saidWords: "", amount: null, status: "needs-answer" });
    const [question] = questionsFromReading([salt], [], "r1");
    expect(question).toMatchObject({ kind: "missing-amount", lineId: "s", answered: false, text: "How much salt was it?" });
    expect(salt.amount).toBeNull();
  });

  it("a rough word the table does not know asks about mom's own words", () => {
    const sugar = line({ id: "g", name: "sugar", saidWords: "a smidge", amount: null, status: "needs-answer" });
    const [question] = questionsFromReading([sugar], [], "r1");
    expect(question).toMatchObject({ kind: "unknown-rough-word", lineId: "g" });
    expect(question.text).toContain("a smidge");
  });

  it("lines that have an amount ask nothing", () => {
    expect(questionsFromReading([line({})], [], "r1")).toEqual([]);
  });

  it("does not ask twice when Gemini asks about an ingredient that already has its own question", () => {
    const salt = line({ id: "s", name: "salt", saidWords: "", amount: null, status: "needs-answer" });
    const questions = questionsFromReading([salt], [{ kind: "missing-amount", ingredientName: "Salt", text: "How much salt was it?" }], "r1");
    expect(questions).toHaveLength(1);
  });

  it("keeps Gemini's other questions, with no line behind them", () => {
    const questions = questionsFromReading([], [{ kind: "unclear-ingredient", ingredientName: null, text: "What did mom add?" }], "r2");
    expect(questions).toEqual([{ id: "r2-0", kind: "unclear-ingredient", text: "What did mom add?", answered: false }]);
  });

  it("a question stays open until it is answered, and goes away when its line is answered or removed", () => {
    const salt = line({ id: "s", name: "salt", saidWords: "", amount: null, status: "needs-answer" });
    const questions = questionsFromReading([salt], [{ kind: "unclear-ingredient", ingredientName: null, text: "What?" }], "r1");
    expect(openQuestions([salt], questions)).toHaveLength(2);

    const answered = answerWithAmount([salt], "s", { quantity: 1, unit: "teaspoon" });
    expect(openQuestions(answered, questions)).toHaveLength(1);
    expect(openQuestions(removeLine([salt], "s"), questions)).toHaveLength(1);
    expect(openQuestions([salt], answerQuestion(questions, "r1-0"))).toHaveLength(1);
  });
});

describe("answering a line that had no amount", () => {
  const salt = line({ id: "s", name: "salt", saidWords: "just a little bit", amount: null, status: "needs-answer" });

  it("an amount picked by the daughter is her answer, not an estimate", () => {
    const [answered] = answerWithAmount([salt], "s", { quantity: 1 / 2, unit: "teaspoon" });
    expect(answered).toMatchObject({ status: "confirmed", amount: { quantity: 1 / 2, unit: "teaspoon" }, saidWords: "just a little bit" });
  });

  it("keeping it as mom says leaves mom's words, no number, and no estimate", () => {
    const [kept] = keepAsMomsSays([salt], "s");
    expect(kept).toMatchObject({ status: "as-moms-says", amount: null, saidWords: "just a little bit" });
  });

  it("only works on a line that is waiting for an answer", () => {
    const flour = line({});
    expect(keepAsMomsSays([flour], "a")[0]).toBe(flour);
    expect(answerWithAmount([flour], "a", { quantity: 1, unit: "cup" })[0]).toBe(flour);
  });
});

describe("what comes back after Finish", () => {
  it("brings back an ignored question and an estimate nobody confirmed, questions first", () => {
    const flour = line({ id: "f" });
    const salt = line({ id: "s", name: "salt", saidWords: "", amount: null, status: "needs-answer" });
    const eggs = line({ id: "e", name: "eggs", status: "exact", saidWords: "", amount: { quantity: 2, unit: "" } });
    const questions = questionsFromReading([salt], [], "r1");
    const back = leftovers([flour, salt, eggs], questions);
    expect(back.map((item) => item.type)).toEqual(["question", "estimate"]);
  });

  it("brings back nothing once estimates are confirmed and questions are answered or kept as mom says", () => {
    const flour = line({ id: "f" });
    const salt = line({ id: "s", name: "salt", saidWords: "", amount: null, status: "needs-answer" });
    const questions = questionsFromReading([salt], [], "r1");
    const settled = keepAsMomsSays(confirmLine([flour, salt], "f"), "s");
    expect(leftovers(settled, questions)).toEqual([]);
  });

  it("says there is nothing to finish only when nothing at all was heard", () => {
    expect(hasNothingToFinish([], [])).toBe(true);
    expect(hasNothingToFinish([], ["Stir it."])).toBe(false);
    expect(hasNothingToFinish([line({})], [])).toBe(false);
  });
});

describe("photos on lines", () => {
  it("attaches a photo to one line and keeps everything else about it", () => {
    const result = attachPhoto([line({ id: "a" }), line({ id: "b" })], "b", "data:image/jpeg;base64,AAAA");
    expect(result[1]).toMatchObject({ photo: "data:image/jpeg;base64,AAAA", status: "estimate", saidWords: "a handful" });
    expect(result[0].photo).toBeUndefined();
  });

  it("taking another photo replaces the first", () => {
    const once = attachPhoto([line({})], "a", "first");
    expect(attachPhoto(once, "a", "second")[0].photo).toBe("second");
  });
});
