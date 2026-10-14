"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { DemoBanner } from "@/components/DemoBanner";
import { IngredientLine } from "@/components/IngredientLine";
import { LeftoverView } from "@/components/LeftoverView";
import { MealPrompt } from "@/components/MealPrompt";
import { ListeningSign } from "@/components/ListeningSign";
import { QuestionCard } from "@/components/QuestionCard";
import { RecipeCard } from "@/components/RecipeCard";
import { TypeOrPasteBox } from "@/components/TypeOrPasteBox";
import { sendDemo } from "@/lib/demoUnderstanding";
import { createEars } from "@/lib/ears";
import type { Ears, EarsState } from "@/lib/ears";
import { measureHeard } from "@/lib/measuringTable";
import { saveRecipe } from "@/lib/recipeBox";
import type { SaveResult } from "@/lib/recipeBox";
import {
  addLines,
  answerQuestion,
  attachPhoto,
  answerWithAmount,
  changeAmount,
  confirmLine,
  hasNothingToFinish,
  keepAsMomsSays,
  leftovers,
  openQuestions,
  questionsFromReading,
  removeLine,
} from "@/lib/sessionRules";
import { createPhraseCollector, createUnderstandingQueue, UnderstandingError } from "@/lib/understandingClient";
import type { Amount, HeardIngredient, HeardQuestion, IngredientLine as Line, Question } from "@/lib/types";

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
  // useSearchParams needs a Suspense boundary around it for the production build.
  return (
    <Suspense fallback={null}>
      <Session />
    </Suspense>
  );
}

const SAVE_MESSAGE: Record<SaveResult | "saving", string> = {
  saving: "Saving this recipe…",
  saved: "Saved on this device. You will find it on the home page.",
  "saved-without-photos": "Saved on this device, but without its photos: there was not enough room for them.",
  failed: "This recipe could not be saved on this device. Keep this page open if you want to read it again.",
};

function Session() {
  const router = useRouter();
  const name = (useSearchParams().get("name") ?? "").trim();

  // A session cannot start without a name: go and ask for one.
  useEffect(() => {
    if (name === "") router.replace("/new");
  }, [name, router]);

  const [lines, setLines] = useState<Line[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  // Questions the daughter said "ask me later" to. They all come back after Finish.
  const [later, setLater] = useState<string[]>([]);
  const [view, setView] = useState<"cooking" | "finished">("cooking");
  // Photos stay on this device. A camera problem is shown as one notice; the photo buttons keep working.
  const [mealPhoto, setMealPhoto] = useState<string | undefined>();
  const [mealDone, setMealDone] = useState(false);
  const [cameraProblem, setCameraProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState<SaveResult | "saving" | null>(null);
  // One id for the whole session, so finishing twice replaces the recipe instead of adding a second.
  const recipeId = useRef<string | null>(null);
  const [reading, setReading] = useState(0);
  const [failed, setFailed] = useState<FailedText | null>(null);
  const [earsState, setEarsState] = useState<EarsState>("off");
  const [hearing, setHearing] = useState("");

  // The queue reads the ingredient names at the moment a request is sent,
  // which can be before React has drawn the newest lines. This ref always
  // holds the latest list.
  const latestLines = useRef<Line[]>([]);
  const lineCount = useRef(0);
  const readingCount = useRef(0);
  const understand = useRef(createUnderstandingQueue(sendDemo)).current;

  // Every change to the lines goes through one of the session rules.
  function updateLines(rule: (current: Line[]) => Line[]) {
    latestLines.current = rule(latestLines.current);
    setLines(latestLines.current);
  }

  function addHeard(heard: HeardIngredient[], heardQuestions: HeardQuestion[]) {
    const added = heard.map((ingredient) => {
      lineCount.current += 1;
      return toLine(ingredient, `line-${lineCount.current}`);
    });
    updateLines((current) => addLines(current, added));
    readingCount.current += 1;
    const asked = questionsFromReading(added, heardQuestions, `q-reading-${readingCount.current}`);
    setQuestions((current) => [...current, ...asked]);
  }

  async function readText(text: string) {
    setFailed(null);
    setReading((count) => count + 1);
    try {
      const answer = await understand(text, () => latestLines.current.map((line) => line.name));
      addHeard(answer.ingredients, answer.questions);
      setSteps((current) => [...current, ...answer.steps]);
    } catch (error) {
      // No line is invented. The words are kept so they can be sent again.
      const message = error instanceof UnderstandingError ? error.message : "I couldn't understand that.";
      setFailed({ text, message });
    } finally {
      setReading((count) => count - 1);
    }
  }

  // Spoken phrases take exactly the same path as typed text: readText.
  // The ref keeps the ears pointed at the newest readText without restarting them.
  const readSpoken = useRef(readText);
  readSpoken.current = readText;
  const ears = useRef<Ears | null>(null);

  const collectorRef = useRef<ReturnType<typeof createPhraseCollector> | null>(null);

  useEffect(() => {
    const collector = createPhraseCollector((text) => readSpoken.current(text));
    collectorRef.current = collector;
    const created = createEars({ onPhrase: collector.add, onHearing: setHearing, onState: setEarsState });
    ears.current = created;
    return () => {
      created.stop();
      collector.flush();
    };
  }, []);

  // Finish stops listening and sends off the last words, so nothing said is left behind.
  function finish() {
    ears.current?.stop();
    collectorRef.current?.flush();
    setView("finished");
  }

  function sendAnswerText(questionId: string, text: string) {
    setQuestions((current) => answerQuestion(current, questionId));
    readText(text);
  }

  const photos = {
    onPhoto: (id: string, photo: string) => updateLines((current) => attachPhoto(current, id, photo)),
    onCameraProblem: setCameraProblem,
  };
  const cameraNotice = cameraProblem && (
    <div className="notice" role="status">
      <p>{cameraProblem}</p>
    </div>
  );

  const pickAmountFor = (id: string, amount: Amount) => updateLines((current) => answerWithAmount(current, id, amount));
  const confirmLineById = (id: string) => updateLines((current) => confirmLine(current, id));
  const changeLineAmount = (id: string, amount: Amount) => updateLines((current) => changeAmount(current, id, amount));
  const removeLineById = (id: string) => updateLines((current) => removeLine(current, id));

  const items = leftovers(lines, questions);
  const questionsDone = view === "finished" && reading === 0 && !hasNothingToFinish(lines, steps) && items.length === 0;
  const cardReady = questionsDone && mealDone;

  // The card is the end of the session: keep the recipe on this device.
  useEffect(() => {
    if (!cardReady) return;
    recipeId.current ??= crypto.randomUUID();
    setSaved("saving");
    saveRecipe({ id: recipeId.current, name, finishedAt: new Date().toISOString(), ingredients: lines, steps, mealPhoto }).then(setSaved);
    // lines, steps and name are settled once the card is ready; saving again on every render would repeat it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardReady]);

  if (name === "") return null;

  const header = (
    <header className="session__header">
      <span className="session__mark">Handful</span>
      <h1 className="session__title">{view === "finished" ? "Almost done" : name}</h1>
    </header>
  );

  if (view === "finished") {
    if (reading > 0) {
      return (
        <main className="session">
          {header}
          <p className="status" role="status">
            Reading mom's last words…
          </p>
        </main>
      );
    }

    if (hasNothingToFinish(lines, steps)) {
      return (
        <main className="session">
          {header}
          <div className="notice" role="status">
            <p>There is nothing to make a card from yet. Mom has not added anything the app could pick up.</p>
            <div className="notice__actions">
              <button type="button" className="button" onClick={() => setView("cooking")}>
                Keep listening
              </button>
              <Link href="/" className="button button--quiet button--link">
                Leave
              </Link>
            </div>
          </div>
        </main>
      );
    }

    if (items.length > 0) {
      return (
        <main className="session">
          {header}
          <LeftoverView
            items={items}
            lines={lines}
            onConfirm={confirmLineById}
            onChange={changeLineAmount}
            onRemove={removeLineById}
            onAnswerWithAmount={pickAmountFor}
            onAsMomsSays={(id) => updateLines((current) => keepAsMomsSays(current, id))}
            onSendText={sendAnswerText}
            onSkip={(id) => setQuestions((current) => answerQuestion(current, id))}
            onBack={() => setView("cooking")}
          />
        </main>
      );
    }

    if (!mealDone) {
      return (
        <main className="session">
          {header}
          {cameraNotice}
          <MealPrompt
            photo={mealPhoto}
            onPhoto={setMealPhoto}
            onCameraProblem={setCameraProblem}
            onDone={() => setMealDone(true)}
          />
        </main>
      );
    }

    return (
      <main className="session">
        <RecipeCard name={name} ingredients={lines} steps={steps} mealPhoto={mealPhoto} />
        <p className="status" role="status">
          {SAVE_MESSAGE[saved ?? "saving"]}
        </p>
        <div className="notice__actions">
          <button type="button" className="button button--quiet" onClick={() => setView("cooking")}>
            Back to listening
          </button>
          <Link href="/" className="button button--quiet button--link">
            Home
          </Link>
        </div>
      </main>
    );
  }

  const nextQuestion = openQuestions(lines, questions).find((question) => !later.includes(question.id));
  const nextQuestionLine = nextQuestion?.lineId ? lines.find((line) => line.id === nextQuestion.lineId) : undefined;

  return (
    <main className="session">
      {header}
      {cameraNotice}

      <DemoBanner onSample={readText} />

      <ListeningSign
        state={earsState}
        hearing={hearing}
        onStart={() => ears.current?.start()}
        onStop={() => ears.current?.stop()}
      />

      <section aria-labelledby="ingredients-title">
        <h2 id="ingredients-title" className="section__title">
          Ingredients
        </h2>
        {lines.length === 0 ? (
          <p className="empty">
            Nothing here yet. Start listening, or type what mom is adding, like <span className="moms-words">a handful of flour</span>
          </p>
        ) : (
          <ul className="lines" aria-live="polite">
            {lines.map((line) => (
              <IngredientLine key={line.id} line={line} onConfirm={confirmLineById} onChange={changeLineAmount} onRemove={removeLineById} photos={photos} />
            ))}
          </ul>
        )}
      </section>

      {nextQuestion && (
        <QuestionCard
          key={nextQuestion.id}
          question={nextQuestion}
          line={nextQuestionLine}
          onPick={(amount) => nextQuestionLine && pickAmountFor(nextQuestionLine.id, amount)}
          onSendText={(text) => sendAnswerText(nextQuestion.id, text)}
          onLater={() => setLater((current) => [...current, nextQuestion.id])}
        />
      )}

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

      <button type="button" className="button button--finish" onClick={finish}>
        Finish
      </button>
    </main>
  );
}
