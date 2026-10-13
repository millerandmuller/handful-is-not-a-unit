"use client";

import { PhotoButton } from "@/components/PhotoButton";

interface MealPromptProps {
  photo: string | undefined;
  onPhoto: (photo: string) => void;
  onCameraProblem: (message: string) => void;
  onDone: () => void;
}

/** After the questions: one picture of the finished meal. Skipping it is fine. */
export function MealPrompt({ photo, onPhoto, onCameraProblem, onDone }: MealPromptProps) {
  return (
    <section aria-labelledby="meal-title" className="leftovers">
      <h2 id="meal-title" className="section__title">
        The finished dish
      </h2>
      <p>Take a picture of the finished meal for the top of the card, or skip it.</p>
      {photo && /* eslint-disable-next-line @next/next/no-img-element */ <img className="meal__preview" src={photo} alt="The finished meal" />}
      <div className="notice__actions">
        <PhotoButton label={photo ? "Take another" : "Take a photo"} onPhoto={onPhoto} onCameraProblem={onCameraProblem} />
        <button type="button" className={photo ? "button" : "button button--quiet"} onClick={onDone}>
          {photo ? "Use this photo" : "Skip the photo"}
        </button>
      </div>
    </section>
  );
}
