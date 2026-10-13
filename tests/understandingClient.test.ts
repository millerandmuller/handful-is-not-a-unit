import { describe, expect, it } from "vitest";
import { createUnderstandingQueue } from "../lib/understandingClient";
import type { UnderstandAnswer, UnderstandRequest } from "../lib/types";

const empty: UnderstandAnswer = { ingredients: [], steps: [], questions: [] };

describe("the understanding queue", () => {
  it("sends one request at a time and reads the known ingredients when its turn comes", async () => {
    const known: string[] = [];
    const seen: UnderstandRequest[] = [];
    const understand = createUnderstandingQueue(async (request) => {
      seen.push(request);
      known.push(request.newText);
      return empty;
    });

    await Promise.all([understand("flour", () => [...known]), understand("eggs", () => [...known])]);

    expect(seen).toEqual([
      { newText: "flour", knownIngredients: [] },
      { newText: "eggs", knownIngredients: ["flour"] },
    ]);
  });

  it("retries once, then gives up", async () => {
    let calls = 0;
    const understand = createUnderstandingQueue(async () => {
      calls += 1;
      throw new Error("down");
    });
    await expect(understand("flour", () => [])).rejects.toThrow("down");
    expect(calls).toBe(2);
  });

  it("keeps going after a failed request", async () => {
    let calls = 0;
    const understand = createUnderstandingQueue(async () => {
      calls += 1;
      if (calls <= 2) throw new Error("down");
      return empty;
    });
    await expect(understand("flour", () => [])).rejects.toThrow();
    await expect(understand("eggs", () => [])).resolves.toEqual(empty);
  });
});

describe("the phrase collector", () => {
  it("joins phrases said close together and hands them over after a pause", async () => {
    const { createPhraseCollector } = await import("../lib/understandingClient");
    const { vi } = await import("vitest");
    vi.useFakeTimers();
    const ready: string[] = [];
    const collector = createPhraseCollector((text) => ready.push(text), 1000);

    collector.add("a handful of");
    vi.advanceTimersByTime(600);
    collector.add("flour");
    vi.advanceTimersByTime(600);
    expect(ready).toEqual([]);
    vi.advanceTimersByTime(500);
    expect(ready).toEqual(["a handful of flour"]);

    collector.add("two eggs");
    collector.flush();
    expect(ready).toEqual(["a handful of flour", "two eggs"]);
    collector.flush();
    expect(ready).toHaveLength(2);
    vi.useRealTimers();
  });
});
