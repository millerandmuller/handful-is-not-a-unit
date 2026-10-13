"use client";

import { IngredientLine } from "@/components/IngredientLine";
import { QuestionCard } from "@/components/QuestionCard";
import type { Leftover } from "@/lib/sessionRules";
import type { Amount, IngredientLine as Line } from "@/lib/types";

interface LeftoverViewProps {
  /** What is still to look at, in order. Never empty: the page shows the card instead. */
  items: Leftover[];
  lines: Line[];
  onConfirm: (lineId: string) => void;
  onChange: (lineId: string, amount: Amount) => void;
  onRemove: (lineId: string) => void;
  onAnswerWithAmount: (lineId: string, amount: Amount) => void;
  onAsMomsSays: (lineId: string) => void;
  onSendText: (questionId: string, text: string) => void;
  onSkip: (questionId: string) => void;
  onBack: () => void;
}

/** After Finish: one thing at a time that still needs a look before the card. */
export function LeftoverView({ items, lines, onConfirm, onChange, onRemove, onAnswerWithAmount, onAsMomsSays, onSendText, onSkip, onBack }: LeftoverViewProps) {
  const [current] = items;
  const line = current.type === "question" && current.question.lineId ? lines.find((candidate) => candidate.id === current.question.lineId) : undefined;

  return (
    <section aria-labelledby="leftovers-title" className="leftovers">
      <h2 id="leftovers-title" className="section__title">
        {items.length === 1 ? "One last thing" : `${items.length} things to look at before the card`}
      </h2>

      {current.type === "estimate" ? (
        <>
          <p>Mom's words gave an estimate. Is it right?</p>
          <ul className="lines">
            <IngredientLine key={current.line.id} line={current.line} onConfirm={onConfirm} onChange={onChange} onRemove={onRemove} />
          </ul>
        </>
      ) : (
        <QuestionCard
          key={current.question.id}
          question={current.question}
          line={line}
          onPick={(amount) => line && onAnswerWithAmount(line.id, amount)}
          onSendText={(text) => onSendText(current.question.id, text)}
          onAsMomsSays={line && (() => onAsMomsSays(line.id))}
          onRemoveLine={line && (() => onRemove(line.id))}
          onSkip={line ? undefined : () => onSkip(current.question.id)}
        />
      )}

      <button type="button" className="button button--quiet leftovers__back" onClick={onBack}>
        Not finished: back to listening
      </button>
    </section>
  );
}
