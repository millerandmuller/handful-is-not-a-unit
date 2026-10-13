import { describe, expect, it } from "vitest";
import { addLines, changeAmount, confirmLine, removeLine } from "../lib/sessionRules";
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
