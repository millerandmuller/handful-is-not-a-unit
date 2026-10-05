"use client";

import { useRef, useState } from "react";
import { IngredientLine } from "@/components/IngredientLine";
import { TypeOrPasteBox } from "@/components/TypeOrPasteBox";
import { measureHeard } from "@/lib/measuringTable";
import { createUnderstandingQueue, UnderstandingError } from "@/lib/understandingClient";
import type { HeardIngredient, IngredientLine as Line } from "@/lib/types";

interface FailedText {
  text: string;
  message: string;
}

function toLine(heard: HeardIngredient, id: string): Line {
  return {
    id,
    name: heard.name,
    foodGroup: heard.foodGroup,
    saidWords: heard.saidWords,
    ...measureHeard(heard),
  };
}

export default function SessionPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [reading, setReading] = useState(0);
  const [failed, setFailed] = useState<FailedText | null>(null);

  // The queue reads the ingredient names at the moment a request is sent,
  // which can be before React has drawn the newest lines. This ref always
  // holds the latest list.
  const latestLines = useRef<Line[]>([]);
  const lineCount = useRef(0);
  const understand = useRef(createUnderstandingQueue()).current;

  function addLines(heard: HeardIngredient[]) {
    const added = heard.map((ingredient) => {
      lineCount.current += 1;
      return toLine(ingredient, `line-${lineCount.current}`);
    });
    latestLines.current = [...latestLines.current, ...added];
    setLines(latestLines.current);
  }

  async function readText(text: string) {
    setFailed(null);
    setReading((count) => count + 1);
    try {
      const answer = await understand(text, () => latestLines.current.map((line) => line.name));
      addLines(answer.ingredients);
      setSteps((current) => [...current, ...answer.steps]);
    } catch (error) {
      // No line is invented. The words are kept so they can be sent again.
      const message = error instanceof UnderstandingError ? error.message : "I couldn't understand that.";
      setFailed({ text, message });
    } finally {
      setReading((count) => count - 1);
    }
  }

  return (
    <main className="session">
      <header className="session__header">
        <span className="session__mark">Handful</span>
        <h1 className="session__title">New recipe</h1>
      </header>

      <section aria-labelledby="ingredients-title">
        <h2 id="ingredients-title" className="section__title">
          Ingredients
        </h2>
        {lines.length === 0 ? (
          <p className="empty">
            Nothing here yet. Tell me what mom is adding, like <span className="moms-words">a handful of flour</span>
          </p>
        ) : (
          <ul className="lines" aria-live="polite">
            {lines.map((line) => (
              <IngredientLine key={line.id} line={line} />
            ))}
          </ul>
        )}
      </section>

      {steps.length > 0 && (
        <section aria-labelledby="steps-title">
          <h2 id="steps-title" className="section__title">
            Steps so far
          </h2>
          <ol className="steps">
            {steps.map((step, index) => (
              <li key={index}>
                <span className="moms-words">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="status" role="status">
        {reading > 0 ? "Reading mom's words…" : ""}
      </p>

      {failed && (
        <div className="notice" role="alert">
          <p>{failed.message} Nothing was added.</p>
          <p>
            <span className="moms-words">{failed.text}</span>
          </p>
          <div className="notice__actions">
            <button type="button" className="button" onClick={() => readText(failed.text)}>
              Try again
            </button>
            <button type="button" className="button button--quiet" onClick={() => setFailed(null)}>
              Leave it out
            </button>
          </div>
        </div>
      )}

      <TypeOrPasteBox onSend={readText} />
    </main>
  );
}
