"use client";

import { useState } from "react";
import { MAX_TEXT_LENGTH } from "@/lib/types";

interface TypeOrPasteBoxProps {
  onSend: (text: string) => void;
}

// How close to the limit before the count is shown.
const SHOW_COUNT_FROM = MAX_TEXT_LENGTH - 300;

/**
 * The always-there way in: whatever is typed or pasted here takes exactly the
 * same path as spoken words, so the app works with no microphone at all.
 */
export function TypeOrPasteBox({ onSend }: TypeOrPasteBoxProps) {
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const isFull = text.length >= MAX_TEXT_LENGTH;

  function send() {
    if (trimmed === "") return;
    onSend(trimmed);
    setText("");
  }

  function sendOnEnter(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter makes a new line. Ignore Enter while a
    // keyboard is still composing a character.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    send();
  }

  return (
    <div className="typebox">
      <label className="typebox__label" htmlFor="said-text">
        Type or paste what mom said
      </label>
      <div className="typebox__row">
        <textarea
          id="said-text"
          className="typebox__text"
          value={text}
          maxLength={MAX_TEXT_LENGTH}
          placeholder="a handful of flour and two eggs"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={sendOnEnter}
        />
        <button type="button" className="button" onClick={send} disabled={trimmed === ""}>
          Send
        </button>
      </div>
      {text.length >= SHOW_COUNT_FROM && (
        <p className={isFull ? "typebox__hint typebox__hint--full" : "typebox__hint"} role="status">
          {isFull
            ? `That is the most I can read at once (${MAX_TEXT_LENGTH} letters). Send this part, then the rest.`
            : `${text.length} of ${MAX_TEXT_LENGTH} letters`}
        </p>
      )}
    </div>
  );
}
