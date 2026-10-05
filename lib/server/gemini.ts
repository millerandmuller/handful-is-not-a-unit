// The one place that calls Gemini, and the only file that reads the key.
// It reads process.env directly (instead of taking the key as an argument) so
// the key never travels through any other part of the app.

import { GoogleGenAI } from "@google/genai";
import { ANSWER_SCHEMA, INSTRUCTIONS } from "./instructions";
import type { UnderstandRequest } from "../types";

export const GEMINI_MODEL = "gemini-3.8-flash";

export class MissingKeyError extends Error {}

/** Sends mom's words to Gemini and returns its raw text answer, unchecked. */
export async function askGemini(request: UnderstandRequest): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new MissingKeyError("GEMINI_API_KEY is not set");

  const client = new GoogleGenAI({ apiKey });
  const interaction = await client.interactions.create({
    model: GEMINI_MODEL,
    system_instruction: INSTRUCTIONS,
    input: JSON.stringify(request),
    response_format: { type: "text", mime_type: "application/json", schema: ANSWER_SCHEMA },
  });

  if (!interaction.output_text) throw new Error("Gemini returned no text");
  return interaction.output_text;
}
