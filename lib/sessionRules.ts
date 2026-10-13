// The rules for what happens to the lines of a session. Pure: each rule takes
// the current lines and returns the new lines. No screen code in here.

import type { Amount, HeardQuestion, IngredientLine, Question } from "./types";

// Lines that have an amount a person can look at and correct.
const HAS_AMOUNT = new Set(["exact", "estimate", "confirmed", "changed"]);

function sameAmount(a: Amount, b: Amount): boolean {
  return a.unit === b.unit && Math.abs(a.quantity - b.quantity) < 0.0001;
}

function updateLine(lines: IngredientLine[], id: string, change: (line: IngredientLine) => IngredientLine): IngredientLine[] {
  return lines.map((line) => (line.id === id ? change(line) : line));
}

export function addLines(lines: IngredientLine[], added: IngredientLine[]): IngredientLine[] {
  return [...lines, ...added];
}

/** One tap on an estimate: the amount is right. Any other line is left as it is. */
export function confirmLine(lines: IngredientLine[], id: string): IngredientLine[] {
  return updateLine(lines, id, (line) => (line.status === "estimate" ? { ...line, status: "confirmed" } : line));
}

/**
 * Pick a different amount. A line with no amount yet is left alone, because
 * answering a missing amount is a question, not a correction.
 * Picking the amount an estimate already has counts as confirming it.
 */
export function changeAmount(lines: IngredientLine[], id: string, amount: Amount): IngredientLine[] {
  return updateLine(lines, id, (line) => {
    if (!line.amount || !HAS_AMOUNT.has(line.status)) return line;
    if (sameAmount(line.amount, amount)) return confirmLine([line], id)[0];
    return { ...line, amount, status: "changed" };
  });
}

export function removeLine(lines: IngredientLine[], id: string): IngredientLine[] {
  return lines.filter((line) => line.id !== id);
}

// ---- Questions ----

/** The question for a line that has no trustworthy amount, or null for any other line. */
export function questionForLine(line: IngredientLine): Question | null {
  if (line.status !== "needs-answer") return null;
  const heardWords = line.saidWords.trim();
  return heardWords
    ? { id: `q-${line.id}`, kind: "unknown-rough-word", lineId: line.id, answered: false, text: `Mom said "${heardWords}" of ${line.name}. How much is that?` }
    : { id: `q-${line.id}`, kind: "missing-amount", lineId: line.id, answered: false, text: `How much ${line.name} was it?` };
}

/**
 * The questions that come out of one reading of mom's words: one for each new
 * line with no amount, plus the ones Gemini asked. Gemini's own question about
 * an ingredient that already has a question of its own is dropped, so nobody is asked twice.
 */
export function questionsFromReading(newLines: IngredientLine[], heard: HeardQuestion[], idPrefix: string): Question[] {
  const fromLines = newLines.map(questionForLine).filter((question): question is Question => question !== null);
  const alreadyAsked = new Set(newLines.filter((line) => line.status === "needs-answer").map((line) => line.name.toLowerCase()));

  const fromGemini = heard
    .filter((question) => !(question.kind === "missing-amount" && question.ingredientName && alreadyAsked.has(question.ingredientName.toLowerCase())))
    .map((question, index): Question => ({ id: `${idPrefix}-${index}`, kind: question.kind, text: question.text, answered: false }));

  return [...fromLines, ...fromGemini];
}

/** Questions still waiting: not answered, and (for a line's question) the line still needs its answer. */
export function openQuestions(lines: IngredientLine[], questions: Question[]): Question[] {
  return questions.filter((question) => {
    if (question.answered) return false;
    if (!question.lineId) return true;
    return lines.some((line) => line.id === question.lineId && line.status === "needs-answer");
  });
}

/** A question with no line behind it is finished when it is answered or set aside. */
export function answerQuestion(questions: Question[], id: string): Question[] {
  return questions.map((question) => (question.id === id ? { ...question, answered: true } : question));
}

/** The daughter picks the amount for a line that had none. It is her answer, so it is not an estimate. */
export function answerWithAmount(lines: IngredientLine[], id: string, amount: Amount): IngredientLine[] {
  return updateLine(lines, id, (line) => (line.status === "needs-answer" ? { ...line, amount, status: "confirmed" } : line));
}

/** Keep a line with no amount "as mom says": mom's words stay, there is no number, and it is not an estimate. */
export function keepAsMomsSays(lines: IngredientLine[], id: string): IngredientLine[] {
  return updateLine(lines, id, (line) => (line.status === "needs-answer" ? { ...line, amount: null, status: "as-moms-says" } : line));
}

// ---- Finishing ----

export type Leftover =
  | { type: "question"; question: Question }
  | { type: "estimate"; line: IngredientLine };

/** What comes back after Finish: unanswered questions first, then estimates nobody confirmed or changed. */
export function leftovers(lines: IngredientLine[], questions: Question[]): Leftover[] {
  return [
    ...openQuestions(lines, questions).map((question): Leftover => ({ type: "question", question })),
    ...lines.filter((line) => line.status === "estimate").map((line): Leftover => ({ type: "estimate", line })),
  ];
}

/** Nothing heard at all: there is no card to make. */
export function hasNothingToFinish(lines: IngredientLine[], steps: string[]): boolean {
  return lines.length === 0 && steps.length === 0;
}
