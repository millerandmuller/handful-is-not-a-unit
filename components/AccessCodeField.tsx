"use client";

import { useState } from "react";
import { checkAccessCode, clearAccessCode, setAccessCode } from "@/lib/accessCode";

interface AccessCodeFieldProps {
  unlocked: boolean;
  onUnlocked: () => void;
  onLocked: () => void;
}

const CHECK_MESSAGE = {
  rejected: "That code was not accepted.",
  unreachable: "I couldn't check the code. Check the internet connection and try again.",
} as const;

/**
 * Collapsed by default. A right code switches the page from recorded answers
 * to the real helper; "Back to demo" switches it back.
 */
export function AccessCodeField({ unlocked, onUnlocked, onLocked }: AccessCodeFieldProps) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function unlock() {
    const trimmed = code.trim();
    if (trimmed === "") return;
    setChecking(true);
    setMessage(null);
    const result = await checkAccessCode(trimmed);
    setChecking(false);
    if (result !== "accepted") {
      setMessage(CHECK_MESSAGE[result]);
      return;
    }
    setAccessCode(trimmed);
    setCode("");
    onUnlocked();
  }

  function lock() {
    clearAccessCode();
    onLocked();
  }

  if (unlocked) {
    return (
      <div className="access access--on">
        <p role="status">Access code accepted. The real helper reads what you type or say.</p>
        <button type="button" className="button button--quiet" onClick={lock}>
          Back to demo
        </button>
      </div>
    );
  }

  return (
    <details className="access">
      <summary>Have an access code?</summary>
      <form
        className="access__row"
        onSubmit={(event) => {
          event.preventDefault();
          unlock();
        }}
      >
        <label className="typebox__label" htmlFor="access-code">
          Access code
        </label>
        <input
          id="access-code"
          className="field"
          type="password"
          autoComplete="off"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <button type="submit" className="button" disabled={code.trim() === "" || checking}>
          {checking ? "Checking…" : "Unlock"}
        </button>
      </form>
      {message && (
        <p className="access__message" role="alert">
          {message}
        </p>
      )}
    </details>
  );
}
