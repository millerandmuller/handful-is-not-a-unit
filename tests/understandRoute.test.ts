import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/gemini", () => ({
  askGemini: vi.fn(),
  MissingKeyError: class MissingKeyError extends Error {},
}));

import { POST } from "../app/api/understand/route";
import { askGemini } from "@/lib/server/gemini";

const goodAnswer = JSON.stringify({ ingredients: [], steps: ["Stir."], questions: [] });

function post(body: unknown, code?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (code !== undefined) headers["x-access-code"] = code;
  return new Request("http://localhost/api/understand", { method: "POST", headers, body: JSON.stringify(body) });
}

const sentence = { newText: "a handful of flour", knownIngredients: [] };

beforeEach(() => {
  vi.mocked(askGemini).mockReset().mockResolvedValue(goodAnswer);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/understand with a code configured", () => {
  beforeEach(() => vi.stubEnv("JUDGE_ACCESS_CODE", "open-sesame"));

  it("refuses with 401 and never calls Gemini when there is no code header", async () => {
    const response = await POST(post(sentence));
    expect(response.status).toBe(401);
    expect(askGemini).not.toHaveBeenCalled();
  });

  it("refuses with 401 and never calls Gemini when the code is wrong", async () => {
    const response = await POST(post(sentence, "open-sesamE"));
    expect(response.status).toBe(401);
    expect(askGemini).not.toHaveBeenCalled();
  });

  it("answers when the code is right", async () => {
    const response = await POST(post(sentence, "open-sesame"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ingredients: [], steps: ["Stir."], questions: [] });
    expect(askGemini).toHaveBeenCalledTimes(1);
  });

  it("checks the code before it reads the body", async () => {
    const request = post(sentence, "wrong");
    const readBody = vi.spyOn(request, "json");
    expect((await POST(request)).status).toBe(401);
    expect(readBody).not.toHaveBeenCalled();
  });

  it("answers 400, not 401, to a right code with nothing to read, and never calls Gemini (what the Unlock button relies on)", async () => {
    const response = await POST(post({}, "open-sesame"));
    expect(response.status).toBe(400);
    expect(askGemini).not.toHaveBeenCalled();
  });

  it("never echoes the code, in either answer", async () => {
    for (const request of [post(sentence, "open-sesamE"), post(sentence, "open-sesame")]) {
      expect(JSON.stringify(await (await POST(request)).json())).not.toContain("open-sesam");
    }
  });
});

describe("POST /api/understand with no code configured", () => {
  it.each([undefined, ""])("refuses everything with 401 when JUDGE_ACCESS_CODE is %j", async (value) => {
    if (value !== undefined) vi.stubEnv("JUDGE_ACCESS_CODE", value);
    else vi.stubEnv("JUDGE_ACCESS_CODE", undefined as unknown as string);

    for (const code of [undefined, "", "open-sesame", "undefined"]) {
      expect((await POST(post(sentence, code))).status).toBe(401);
    }
    expect(askGemini).not.toHaveBeenCalled();
  });
});
