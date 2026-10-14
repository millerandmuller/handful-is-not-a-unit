// Decides whether a request may use the real helper (and so spend the Gemini key).
// It fails closed: with no JUDGE_ACCESS_CODE set, nothing is accepted.

import { createHash, timingSafeEqual } from "node:crypto";

export const ACCESS_CODE_HEADER = "x-access-code";

// Both codes are hashed first, so the two buffers always have the same length
// and the comparison does not reveal how long the real code is.
function digest(code: string): Buffer {
  return createHash("sha256").update(code).digest();
}

/** True only when `given` matches the configured code exactly. Never logs or returns either code. */
export function isAccessCodeAccepted(given: string | null, configured: string | undefined): boolean {
  const expected = configured?.trim();
  const offered = given?.trim();
  if (!expected || !offered) return false;
  return timingSafeEqual(digest(offered), digest(expected));
}
