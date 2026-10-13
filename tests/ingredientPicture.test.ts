import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { hasPicture, IngredientPicture } from "../components/IngredientPicture";
import { FOOD_GROUPS } from "../lib/types";

function markup(foodGroup: string): string {
  return renderToStaticMarkup(createElement(IngredientPicture, { name: "salt", foodGroup }));
}

describe("ingredient pictures", () => {
  it("has a drawing for every food group", () => {
    for (const group of FOOD_GROUPS) expect(hasPicture(group), group).toBe(true);
  });

  it("draws twelve different pictures", () => {
    const drawings = new Set(FOOD_GROUPS.map((group) => markup(group).replace(/data-group="[a-z]+"/, "")));
    expect(drawings.size).toBe(FOOD_GROUPS.length);
  });

  it("shows the letter tile when the group is not known", () => {
    const html = markup("mystery");
    expect(html).not.toContain("<svg");
    expect(html).toContain(">s<");
  });
});
