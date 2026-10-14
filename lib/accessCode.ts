// The access code on the page side. It is kept in sessionStorage so a reload
// does not ask again, and in memory so the page still works when storage is blocked.

// Written out again, on purpose: lib/server/accessCode.ts uses Node-only code that must stay out of the page.
export const ACCESS_CODE_HEADER = "x-access-code";
const STORAGE_KEY = "handful-access-code";

let memoryCode: string | null = null;

export function getAccessCode(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? memoryCode;
  } catch {
    return memoryCode;
  }
}

export function setAccessCode(code: string): void {
  memoryCode = code;
  try {
    sessionStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage is blocked: the code lives in memory until the page closes.
  }
}

export function clearAccessCode(): void {
  memoryCode = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}

export type CodeCheck = "accepted" | "rejected" | "unreachable";

/**
 * Asks the helper whether a code is right without sending any text, so Gemini
 * is never called: 401 means the code is wrong, 400 means it is right but
 * there was no text to read.
 */
export async function checkAccessCode(code: string, fetchIt: typeof fetch = fetch): Promise<CodeCheck> {
  try {
    const response = await fetchIt("/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json", [ACCESS_CODE_HEADER]: code },
      body: "{}",
    });
    if (response.status === 401) return "rejected";
    return response.status === 400 ? "accepted" : "unreachable";
  } catch {
    return "unreachable";
  }
}
