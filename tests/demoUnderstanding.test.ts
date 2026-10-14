import { afterEach, describe, expect, it, vi } from "vitest";
import { RECORDED_ANSWERS, SAMPLE_SENTENCES } from "../lib/demo/recordedAnswers";
import { DEMO_ONLY_SAMPLES_MESSAGE, sendDemo } from "../lib/demoUnderstanding";
import { checkAnswer } from "../lib/server/checkAnswer";
import { createUnderstandingQueue, UnderstandingError } from "../lib/understandingClient";

afterEach(() => vi.unstubAllGlobals());

describe("the recorded answers", () => {
  it("has exactly one recorded answer for each of the three sample sentences", () => {
    expect(SAMPLE_SENTENCES).toHaveLength(3);
    expect(Object.keys(RECORDED_ANSWERS).sort()).toEqual([...SAMPLE_SENTENCES].sort());
  });

  it.each(SAMPLE_SENTENCES)("passes the same check as a live answer: %s", (sentence) => {
    const recorded = RECORDED_ANSWERS[sentence];
    expect(checkAnswer(JSON.stringify(recorded))).toEqual(recorded);
  });
});

describe("the demo sender", () => {
  it.each(SAMPLE_SENTENCES)("returns the recorded answer for: %s", async (sentence) => {
    expect(await sendDemo({ newText: sentence, knownIngredients: [] })).toEqual(RECORDED_ANSWERS[sentence]);
  });

  it("ignores which ingredients are already listed", async () => {
    const sentence = SAMPLE_SENTENCES[0];
    expect(await sendDemo({ newText: sentence, knownIngredients: ["flour"] })).toEqual(RECORDED_ANSWERS[sentence]);
  });

  it("gives back a copy, so a change on the page cannot alter the recording", async () => {
    const sentence = SAMPLE_SENTENCES[0];
    const first = await sendDemo({ newText: sentence, knownIngredients: [] });
    first.ingredients.length = 0;
    expect((await sendDemo({ newText: sentence, knownIngredients: [] })).ingredients.length).toBeGreaterThan(0);
  });

  it.each(["a handful of flour", "", SAMPLE_SENTENCES[0].toUpperCase(), `${SAMPLE_SENTENCES[0]} `, "toString", "__proto__"])(
    "refuses anything that is not a sample, exactly: %j",
    async (text) => {
      await expect(sendDemo({ newText: text, knownIngredients: [] })).rejects.toThrow(DEMO_ONLY_SAMPLES_MESSAGE);
    },
  );

  it("says what the spec says to say", () => {
    expect(DEMO_ONLY_SAMPLES_MESSAGE).toBe("Demo mode: only the sample sentences are read. Add an access code to type your own.");
  });
});

describe("demo mode in the queue", () => {
  it("makes no network request, for a sample or for anything else", async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("the network must not be used in demo mode")));
    vi.stubGlobal("fetch", fetchSpy);
    const understand = createUnderstandingQueue(sendDemo);

    await understand(SAMPLE_SENTENCES[1], () => []);
    await expect(understand("two cups of rice", () => [])).rejects.toBeInstanceOf(UnderstandingError);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not retry a refusal", async () => {
    let calls = 0;
    const counting = createUnderstandingQueue((request) => {
      calls += 1;
      return sendDemo(request);
    });
    await expect(counting("two cups of rice", () => [])).rejects.toThrow(DEMO_ONLY_SAMPLES_MESSAGE);
    expect(calls).toBe(1);
  });
});
