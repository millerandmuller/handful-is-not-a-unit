// The helper on the server. It exists to keep the Gemini key out of the page.
// The page sends mom's words here; this passes them to Gemini and checks the answer.

import { askGemini, MissingKeyError } from "@/lib/server/gemini";
import { checkAnswer, UnusableAnswerError } from "@/lib/server/checkAnswer";
import { MAX_TEXT_LENGTH } from "@/lib/types";
import type { UnderstandRequest } from "@/lib/types";

const MAX_KNOWN_INGREDIENTS = 100;
const MAX_NAME_LENGTH = 100;

function refuse(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/** Returns a clean request, or a plain message saying what is wrong with it. */
function readRequest(body: unknown): UnderstandRequest | string {
  if (typeof body !== "object" || body === null) return "The request was not understood.";
  const { newText, knownIngredients } = body as Record<string, unknown>;

  if (typeof newText !== "string" || newText.trim() === "") return "There was no text to read.";
  if (newText.length > MAX_TEXT_LENGTH) return `That is too long. Please send ${MAX_TEXT_LENGTH} characters or fewer at a time.`;

  const known = knownIngredients ?? [];
  if (!Array.isArray(known) || known.some((name) => typeof name !== "string")) {
    return "The list of known ingredients was not understood.";
  }
  return {
    newText: newText.trim(),
    knownIngredients: known.slice(0, MAX_KNOWN_INGREDIENTS).map((name: string) => name.slice(0, MAX_NAME_LENGTH)),
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return refuse("The request was not understood.", 400);
  }

  const understood = readRequest(body);
  if (typeof understood === "string") return refuse(understood, 400);

  try {
    const rawAnswer = await askGemini(understood);
    return Response.json(checkAnswer(rawAnswer));
  } catch (error) {
    if (error instanceof MissingKeyError) {
      console.error("understand: GEMINI_API_KEY is not set");
      return refuse("The helper has no Gemini key yet. See the README for how to add it.", 500);
    }
    if (error instanceof UnusableAnswerError) {
      console.error("understand: unusable answer from Gemini:", error.message);
      return refuse("I couldn't make sense of the answer. Please try again.", 502);
    }
    console.error("understand: Gemini call failed:", error);
    return refuse("I couldn't reach the helper that reads mom's words. Please try again.", 502);
  }
}
