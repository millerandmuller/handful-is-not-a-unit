import { describe, expect, it } from "vitest";
import { isAccessCodeAccepted } from "../lib/server/accessCode";

describe("the access code check", () => {
  it("accepts the exact code", () => {
    expect(isAccessCodeAccepted("open-sesame", "open-sesame")).toBe(true);
  });

  it("ignores spaces around either code, which are easy to paste by accident", () => {
    expect(isAccessCodeAccepted(" open-sesame ", "open-sesame\n")).toBe(true);
  });

  it.each(["open-sesamE", "open-sesam", "open-sesame!", "x", "OPEN-SESAME"])("rejects a wrong code: %s", (given) => {
    expect(isAccessCodeAccepted(given, "open-sesame")).toBe(false);
  });

  it("rejects a missing or empty code", () => {
    expect(isAccessCodeAccepted(null, "open-sesame")).toBe(false);
    expect(isAccessCodeAccepted("", "open-sesame")).toBe(false);
    expect(isAccessCodeAccepted("   ", "open-sesame")).toBe(false);
  });

  it("fails closed when no code is configured: nothing is accepted, not even an empty code", () => {
    for (const configured of [undefined, "", "   "]) {
      expect(isAccessCodeAccepted("anything", configured)).toBe(false);
      expect(isAccessCodeAccepted("", configured)).toBe(false);
      expect(isAccessCodeAccepted(null, configured)).toBe(false);
    }
  });
});
