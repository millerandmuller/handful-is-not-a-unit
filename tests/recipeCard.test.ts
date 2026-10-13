import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CARD_NOTE, RecipeCard } from "../components/RecipeCard";
import type { IngredientLine } from "../lib/types";

const ingredients: IngredientLine[] = [
  { id: "a", name: "flour", foodGroup: "grain", saidWords: "a handful", amount: { quantity: 1 / 4, unit: "cup" }, status: "confirmed" },
  { id: "b", name: "salt", foodGroup: "spice", saidWords: "some", amount: null, status: "as-moms-says" },
];
const steps = ["Mix it until smooth."];

function card(over: { ingredients?: IngredientLine[]; mealPhoto?: string } = {}): string {
  return renderToStaticMarkup(createElement(RecipeCard, { name: "Nonna's Bread", ingredients, steps, ...over }));
}

describe("the recipe card", () => {
  it("is complete with no photos at all", () => {
    const html = card();
    expect(html).toContain("Nonna&#x27;s Bread");
    for (const text of ["flour", "a handful", "¼ cup", "salt", "as mom says", "Mix it until smooth."]) expect(html, text).toContain(text);
    expect(html).toContain(CARD_NOTE.replace("'", "&#x27;"));
    expect(html).not.toContain("<img");
  });

  it("shows the finished meal at the top, above the title, and a line's photo beside its ingredient", () => {
    const withPhotos = card({
      mealPhoto: "data:image/jpeg;base64,MEAL",
      ingredients: [{ ...ingredients[0], photo: "data:image/jpeg;base64,FLOUR" }, ingredients[1]],
    });
    expect(withPhotos.indexOf("base64,MEAL")).toBeGreaterThan(-1);
    expect(withPhotos.indexOf("base64,MEAL")).toBeLessThan(withPhotos.indexOf("<h1"));
    expect(withPhotos.indexOf("base64,FLOUR")).toBeGreaterThan(withPhotos.indexOf("flour"));
    expect(withPhotos.match(/<img/g)).toHaveLength(2);
  });
});
