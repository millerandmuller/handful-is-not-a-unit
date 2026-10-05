import { formatAmount } from "@/lib/measuringTable";
import type { FoodGroup, IngredientLine as Line } from "@/lib/types";

// The stand-in picture: a colored tile with the ingredient's first letter.
const TILE_COLOR: Record<FoodGroup, string> = {
  grain: "mustard",
  dairy: "delft",
  egg: "mustard",
  vegetable: "pandan",
  fruit: "tomato",
  meat: "tomato",
  fish: "delft",
  spice: "tomato",
  oil: "mustard",
  liquid: "delft",
  sweet: "mustard",
  other: "pandan",
};

function AmountShown({ line }: { line: Line }) {
  if (!line.amount || line.status === "needs-answer") {
    return (
      <>
        <span className="line__number line__number--unknown">amount not known yet</span>
        <span className="label">needs an answer</span>
      </>
    );
  }
  if (line.status === "estimate") {
    return (
      <>
        <span className="line__number">about {formatAmount(line.amount)}</span>
        <span className="label">estimate</span>
      </>
    );
  }
  return <span className="line__number">{formatAmount(line.amount)}</span>;
}

/** One row: picture, ingredient, mom's own words, and the amount. */
export function IngredientLine({ line }: { line: Line }) {
  return (
    <li className="line line--new">
      <span className={`tile tile--${TILE_COLOR[line.foodGroup]}`} aria-hidden="true">
        {line.name.charAt(0)}
      </span>
      <div className="line__what">
        <span className="line__name">{line.name}</span>
        {line.saidWords && <span className="moms-words">{line.saidWords}</span>}
      </div>
      <div className="line__amount">
        <AmountShown line={line} />
      </div>
    </li>
  );
}
