import { lineDisplay } from "../lib/lineDisplay";
import type { IngredientLine } from "../lib/types";
import { IngredientPicture } from "./IngredientPicture";

export const CARD_NOTE = "The amounts on this card are estimates. Mom's own words are the real recipe. This card is not food-safety advice.";

interface RecipeCardProps {
  name: string;
  ingredients: IngredientLine[];
  steps: string[];
  /** The finished meal. Optional: a card without any photo is still complete. */
  mealPhoto?: string;
}

function CardAmount({ line }: { line: IngredientLine }) {
  // Everything about the amount comes from lineDisplay, as on the session screen.
  const shown = lineDisplay(line);
  if (shown.amountText) {
    return (
      <>
        <span className="card__amount">{shown.amountText}</span>
        {shown.showEstimateLabel && <span className="label">estimate</span>}
      </>
    );
  }
  return <span className="card__amount card__amount--words">{shown.asMomsSays ? "as mom says" : shown.noAmountGiven ? "no amount given" : "amount not known yet"}</span>;
}

/** The finished recipe: name, ingredients with mom's words, steps, and the short note at the foot. */
export function RecipeCard({ name, ingredients, steps, mealPhoto }: RecipeCardProps) {
  return (
    <div className="card-frame">
      <article className="card">
        {mealPhoto && /* eslint-disable-next-line @next/next/no-img-element */ <img className="card__meal" src={mealPhoto} alt={`${name}, finished`} />}
        <h1 className="card__title">{name}</h1>

        <h2 className="section__title">Ingredients</h2>
        <ul className="card__ingredients">
          {ingredients.map((line) => (
            <li key={line.id} className="card__ingredient">
              <IngredientPicture name={line.name} foodGroup={line.foodGroup} />
              <div className="line__what">
                <span className="line__name">{line.name}</span>
                {lineDisplay(line).saidWords && <span className="moms-words">{lineDisplay(line).saidWords}</span>}
                {line.photo && /* eslint-disable-next-line @next/next/no-img-element */ <img className="card__photo" src={line.photo} alt={`${line.name} being added`} />}
              </div>
              <div className="card__amounts">
                <CardAmount line={line} />
              </div>
            </li>
          ))}
        </ul>

        {steps.length > 0 && (
          <>
            <h2 className="section__title">Steps</h2>
            <ol className="steps">
              {steps.map((step, index) => (
                <li key={index}>
                  <span className="moms-words">{step}</span>
                </li>
              ))}
            </ol>
          </>
        )}

        <p className="card__note">{CARD_NOTE}</p>
      </article>
    </div>
  );
}
