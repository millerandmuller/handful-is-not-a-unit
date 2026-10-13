import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEars } from "../lib/ears";
import type { EarsState, Recognizer, RecognizerResultEvent } from "../lib/ears";

// A stand-in for the browser's speech recognition that the test controls.
class FakeRecognizer implements Recognizer {
  continuous = false;
  interimResults = false;
  lang = "";
  onresult: ((event: RecognizerResultEvent) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  started = false;
  start() {
    this.started = true;
  }
  stop() {
    this.onend?.();
  }
  hear(text: string, isFinal: boolean) {
    this.onresult?.({ resultIndex: 0, results: [{ isFinal, 0: { transcript: text } }] });
  }
}

function setUp(available = true) {
  const recognizers: FakeRecognizer[] = [];
  const phrases: string[] = [];
  const states: EarsState[] = [];
  const hearing: string[] = [];
  const ears = createEars(
    { onPhrase: (text) => phrases.push(text), onHearing: (text) => hearing.push(text), onState: (state) => states.push(state) },
    {
      createRecognizer: () => {
        if (!available) return null;
        const recognizer = new FakeRecognizer();
        recognizers.push(recognizer);
        return recognizer;
      },
    },
  );
  return { ears, recognizers, phrases, states, hearing, latest: () => recognizers.at(-1) as FakeRecognizer };
}

describe("the ears", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts listening and hands over finished phrases", () => {
    const { ears, latest, phrases, states } = setUp();
    ears.start();
    expect(latest().started).toBe(true);
    expect(latest().continuous).toBe(true);
    latest().hear("a handful of flour", true);
    expect(phrases).toEqual(["a handful of flour"]);
    expect(states).toEqual(["listening"]);
  });

  it("shows what is being heard before the phrase is finished", () => {
    const { ears, latest, phrases, hearing } = setUp();
    ears.start();
    latest().hear("a handful", false);
    expect(hearing.at(-1)).toBe("a handful");
    expect(phrases).toEqual([]);
  });

  it("restarts by itself when the browser stops listening", () => {
    const { ears, recognizers, latest, states } = setUp();
    ears.start();
    vi.advanceTimersByTime(10_000);
    latest().onend?.();
    vi.advanceTimersByTime(500);
    expect(recognizers).toHaveLength(2);
    expect(latest().started).toBe(true);
    expect(states).toEqual(["listening"]);
  });

  it("does not lose words the browser never marked as finished", () => {
    const { ears, latest, phrases } = setUp();
    ears.start();
    latest().hear("two eggs", false);
    vi.advanceTimersByTime(10_000);
    latest().onend?.();
    expect(phrases).toEqual(["two eggs"]);
  });

  it("does not restart after the daughter pauses it", () => {
    const { ears, recognizers, states } = setUp();
    ears.start();
    ears.stop();
    vi.advanceTimersByTime(5_000);
    expect(recognizers).toHaveLength(1);
    expect(states).toEqual(["listening", "off"]);
  });

  it("stops trying after several starts that fail at once, instead of looping forever", () => {
    const { ears, recognizers, latest, states } = setUp();
    ears.start();
    for (let run = 0; run < 10 && states.at(-1) === "listening"; run += 1) {
      latest().onend?.();
      vi.advanceTimersByTime(500);
    }
    expect(states.at(-1)).toBe("stopped");
    expect(recognizers).toHaveLength(4);
  });

  it("can be started again after it gave up", () => {
    const { ears, latest, states } = setUp();
    ears.start();
    for (let run = 0; run < 4; run += 1) {
      latest().onend?.();
      vi.advanceTimersByTime(500);
    }
    ears.start();
    expect(states.at(-1)).toBe("listening");
  });

  it("says so when the microphone is not allowed, and does not retry", () => {
    const { ears, recognizers, latest, states } = setUp();
    ears.start();
    latest().onerror?.({ error: "not-allowed" });
    latest().onend?.();
    vi.advanceTimersByTime(5_000);
    expect(states.at(-1)).toBe("not-allowed");
    expect(recognizers).toHaveLength(1);
  });

  it("says so when the browser cannot listen at all", () => {
    const { ears, states } = setUp(false);
    ears.start();
    expect(states.at(-1)).toBe("not-available");
  });
});
