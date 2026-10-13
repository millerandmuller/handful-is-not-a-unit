"use client";

import { useState } from "react";
import { AmountOptions, isSameAmount } from "@/components/AmountPicker";
import { keepButtonLabel } from "@/lib/lineDisplay";
import { AMOUNT_LADDER, nearbyAmounts } from "@/lib/measuringTable";
import type { Amount, IngredientLine, Question } from "@/lib/types";

// Where the amounts start for a line that has none. Nothing is chosen for her:
// she moves smaller or larger and taps the one mom meant.
const START: Amount = { quantity: 1, unit: "tablespoon" };

interface QuestionCardProps {
  question: Question;
  /** The line this question is about, when it has one. */
  line?: IngredientLine;
  onPick: (amount: Amount) => void;
  onSendText: (text: string) => void;
  /** During cooking: leave it for later. */
  onLater?: () => void;
  /** At Finish: keep the line with mom's words and no number. */
  onAsMomsSays?: () => void;
  onRemoveLine?: () => void;
  /** A question with no line can simply be set aside. */
  onSkip?: () => void;
}

function AmountQuestion({ onPick }: { onPick: (amount: Amount) => void }) {
  const [center, setCenter] = useState<Amount>(START);
  const amounts = nearbyAmounts(center, 3);
  const atSmallest = isSameAmount(amounts[0], AMOUNT_LADDER[0]);
  const atLargest = isSameAmount(amounts[amounts.length - 1], AMOUNT_LADDER[AMOUNT_LADDER.length - 1]);

  return (
    <>
      <AmountOptions amounts={amounts} onPick={onPick} />
      <div className="question__more">
        <button type="button" className="button button--quiet" disabled={atSmallest} onClick={() => setCenter(amounts[0])}>
          Smaller amounts
        </button>
        <button type="button" className="button button--quiet" disabled={atLargest} onClick={() => setCenter(amounts[amounts.length - 1])}>
          Larger amounts
        </button>
      </div>
    </>
  );
}

function TextQuestion({ onSendText }: { onSendText: (text: string) => void }) {
  const [text, setText] = useState("");
  const trimmed = text.trim();
  return (
    <div className="question__text">
      <label htmlFor="question-text">Type what mom said, like <span className="moms-words">a cup of brown sugar</span></label>
      <div className="typebox__row">
        <input id="question-text" className="field" value={text} onChange={(event) => setText(event.target.value)} />
        <button type="button" className="button" disabled={trimmed === ""} onClick={() => onSendText(trimmed)}>
          Add it
        </button>
      </div>
    </div>
  );
}

/** One question from the app, with the ways to answer it. */
export function QuestionCard({ question, line, onPick, onSendText, onLater, onAsMomsSays, onRemoveLine, onSkip }: QuestionCardProps) {
  return (
    <section className="question" aria-label="A question from the app">
      <p className="question__text-line">{question.text}</p>
      {line ? <AmountQuestion onPick={onPick} /> : <TextQuestion onSendText={onSendText} />}
      <div className="question__actions">
        {onAsMomsSays && (
          <button type="button" className="button button--quiet" onClick={onAsMomsSays}>
            {line ? keepButtonLabel(line) : "Keep it as mom says"}
          </button>
        )}
        {onRemoveLine && (
          <button type="button" className="button button--quiet" onClick={onRemoveLine}>
            Remove this line
          </button>
        )}
        {onSkip && (
          <button type="button" className="button button--quiet" onClick={onSkip}>
            Skip this question
          </button>
        )}
        {onLater && (
          <button type="button" className="button button--quiet" onClick={onLater}>
            Ask me later
          </button>
        )}
      </div>
    </section>
  );
}
