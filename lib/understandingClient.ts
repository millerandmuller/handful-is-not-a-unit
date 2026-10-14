// Sends mom's words to the helper on the server, one request at a time, so
// each request can tell the helper which ingredients are already on the list.

import type { UnderstandAnswer, UnderstandRequest } from "./types";

const REQUEST_TIMEOUT_MS = 25_000;
const ATTEMPTS = 2; // the first try, then one retry

export class UnderstandingError extends Error {}

/** A refusal that trying again cannot change, so it is never retried. */
export class UnderstandingRefused extends UnderstandingError {}

export type SendToHelper = (request: UnderstandRequest) => Promise<UnderstandAnswer>;

/** One call to the helper. Throws an UnderstandingError with a plain message. */
export async function sendToHelper(request: UnderstandRequest): Promise<UnderstandAnswer> {
  let response: Response;
  try {
    response = await fetch("/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new UnderstandingError("I couldn't reach the helper. Check the internet connection.");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as { error?: unknown } | null)?.error;
    throw new UnderstandingError(typeof message === "string" ? message : "I couldn't understand that.");
  }
  if (body === null) throw new UnderstandingError("I couldn't understand that.");
  return body as UnderstandAnswer;
}

async function sendWithRetry(send: SendToHelper, request: UnderstandRequest): Promise<UnderstandAnswer> {
  let lastError: unknown;
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    try {
      return await send(request);
    } catch (error) {
      if (error instanceof UnderstandingRefused) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

export type Understand = (newText: string, getKnownIngredients: () => string[]) => Promise<UnderstandAnswer>;

/**
 * Returns a function that understands one piece of text at a time, in order.
 * The known ingredients are read only when a request's turn comes, so they
 * include whatever the previous request added.
 */
export function createUnderstandingQueue(send: SendToHelper = sendToHelper): Understand {
  let previous: Promise<unknown> = Promise.resolve();

  return (newText, getKnownIngredients) => {
    const answer = previous.then(() => sendWithRetry(send, { newText, knownIngredients: getKnownIngredients() }));
    // A failed request must not block the ones after it.
    previous = answer.catch(() => undefined);
    return answer;
  };
}

export interface PhraseCollector {
  add(phrase: string): void;
  /** Sends whatever has been collected right away. */
  flush(): void;
}

/**
 * Collects spoken phrases and hands them over together once mom pauses, so
 * "a handful of" and "flour" reach the helper as one piece of text.
 */
export function createPhraseCollector(onReady: (text: string) => void, pauseMs: number = 1200): PhraseCollector {
  let phrases: string[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (phrases.length === 0) return;
    const text = phrases.join(" ");
    phrases = [];
    onReady(text);
  }

  return {
    add(phrase) {
      const cleaned = phrase.trim();
      if (cleaned === "") return;
      phrases.push(cleaned);
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, pauseMs);
    },
    flush,
  };
}
