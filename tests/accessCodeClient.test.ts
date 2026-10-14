import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAccessCode, clearAccessCode, getAccessCode, setAccessCode } from "../lib/accessCode";
import { createModeSender } from "../lib/understandingMode";
import { CodeNotAccepted, createUnderstandingQueue, sendToHelper, UnderstandingError } from "../lib/understandingClient";
import type { UnderstandAnswer } from "../lib/types";

const empty: UnderstandAnswer = { ingredients: [], steps: [], questions: [] };
const request = { newText: "flour", knownIngredients: [] };

afterEach(() => {
  clearAccessCode();
  vi.unstubAllGlobals();
});

describe("the stored access code", () => {
  it("works when storage is blocked (tests have no sessionStorage, as in a blocked browser)", () => {
    expect(getAccessCode()).toBeNull();
    setAccessCode("abc");
    expect(getAccessCode()).toBe("abc");
    clearAccessCode();
    expect(getAccessCode()).toBeNull();
  });

  it("works when storage throws", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    setAccessCode("abc");
    expect(getAccessCode()).toBe("abc");
    clearAccessCode();
    expect(getAccessCode()).toBeNull();
  });
});

describe("checking a code", () => {
  const answering = (status: number) => vi.fn(async () => new Response("{}", { status })) as unknown as typeof fetch;

  it("calls a 400 accepted, a 401 rejected, and anything else unreachable", async () => {
    expect(await checkAccessCode("c", answering(400))).toBe("accepted");
    expect(await checkAccessCode("c", answering(401))).toBe("rejected");
    expect(await checkAccessCode("c", answering(502))).toBe("unreachable");
    expect(await checkAccessCode("c", vi.fn(async () => Promise.reject(new Error("offline"))) as unknown as typeof fetch)).toBe("unreachable");
  });

  it("sends the code in the header and no text", async () => {
    const spy = vi.fn(async () => new Response("{}", { status: 400 }));
    await checkAccessCode("c", spy as unknown as typeof fetch);
    const init = (spy.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.headers).toMatchObject({ "x-access-code": "c" });
    expect(init.body).toBe("{}");
  });
});

describe("the real sender", () => {
  it("sends the stored code as x-access-code, and sends none when there is no code", async () => {
    const spy = vi.fn(async () => Response.json(empty));
    vi.stubGlobal("fetch", spy);

    await sendToHelper(request);
    setAccessCode("abc");
    await sendToHelper(request);

    const headersOf = (call: number) => (spy.mock.calls[call] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headersOf(0)["x-access-code"]).toBeUndefined();
    expect(headersOf(1)["x-access-code"]).toBe("abc");
  });

  it("on a 401 forgets the code, says so plainly, and is not retried", async () => {
    const spy = vi.fn(async () => Response.json({ error: "An access code is needed" }, { status: 401 }));
    vi.stubGlobal("fetch", spy);
    setAccessCode("old");

    await expect(createUnderstandingQueue(sendToHelper)("flour", () => [])).rejects.toThrow("That code was not accepted.");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getAccessCode()).toBeNull();
  });

  it("a 401 is a CodeNotAccepted, which the page uses to return to demo mode", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({}, { status: 401 })));
    const error = await sendToHelper(request).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CodeNotAccepted);
    expect(error).toBeInstanceOf(UnderstandingError);
  });
});

describe("choosing demo or the real helper", () => {
  it("never calls the real sender without a code, so no network request in demo mode", async () => {
    const real = vi.fn(async () => empty);
    const demo = vi.fn(async () => empty);
    await createModeSender({ real, demo, hasCode: () => false })(request);
    expect(real).not.toHaveBeenCalled();
    expect(demo).toHaveBeenCalledTimes(1);
  });

  it("uses the real sender once a code is stored", async () => {
    const real = vi.fn(async () => empty);
    const demo = vi.fn(async () => empty);
    await createModeSender({ real, demo, hasCode: () => true })(request);
    expect(real).toHaveBeenCalledTimes(1);
    expect(demo).not.toHaveBeenCalled();
  });
});
