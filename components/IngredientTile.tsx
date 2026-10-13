import type { FoodGroup } from "@/lib/types";

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

export function IngredientTile({ name, foodGroup }: { name: string; foodGroup: FoodGroup }) {
  return (
    <span className={`tile tile--${TILE_COLOR[foodGroup]}`} aria-hidden="true">
      {name.charAt(0)}
    </span>
  );
}
