import { describe, expect, it } from "vitest";
import { listRecipes, loadRecipe, saveRecipe, withoutPhotos } from "../lib/recipeBox";
import type { RecipeStorage } from "../lib/recipeBox";
import type { Recipe } from "../lib/types";

function recipe(over: Partial<Recipe> = {}): Recipe {
  return {
    id: "r1",
    name: "Nonna's Bread",
    finishedAt: "2026-10-13T10:00:00.000Z",
    ingredients: [
      { id: "a", name: "flour", foodGroup: "grain", saidWords: "a handful", amount: { quantity: 1 / 4, unit: "cup" }, status: "confirmed" },
      { id: "b", name: "salt", foodGroup: "spice", saidWords: "some", amount: null, status: "as-moms-says" },
    ],
    steps: ["Mix it until smooth."],
    ...over,
  };
}

/** A stand-in for the browser's storage. `failWhen` makes a put fail. */
function fakeStorage(failWhen: (recipe: Recipe) => boolean = () => false): RecipeStorage & { kept: Map<string, Recipe> } {
  const kept = new Map<string, Recipe>();
  return {
    kept,
    async put(r) {
      if (failWhen(r)) throw new Error("storage full");
      kept.set(r.id, r);
    },
    async get(id) {
      return kept.get(id);
    },
    async all() {
      return [...kept.values()];
    },
  };
}

describe("saving and loading", () => {
  it("a saved recipe comes back exactly as it was, amounts and mom's words included", async () => {
    const storage = fakeStorage();
    expect(await saveRecipe(recipe(), storage)).toBe("saved");
    expect(await loadRecipe("r1", storage)).toEqual(recipe());
  });

  it("an unknown id loads as nothing", async () => {
    expect(await loadRecipe("nope", fakeStorage())).toBeUndefined();
  });

  it("saving the same recipe again replaces it instead of adding a second one", async () => {
    const storage = fakeStorage();
    await saveRecipe(recipe(), storage);
    await saveRecipe(recipe({ name: "Better Bread" }), storage);
    expect((await listRecipes(storage)).map((r) => r.name)).toEqual(["Better Bread"]);
  });

  it("lists the most recently finished first, and an empty box lists nothing", async () => {
    const storage = fakeStorage();
    expect(await listRecipes(storage)).toEqual([]);
    await saveRecipe(recipe({ id: "old", name: "Old", finishedAt: "2026-10-01T10:00:00.000Z" }), storage);
    await saveRecipe(recipe({ id: "new", name: "New", finishedAt: "2026-10-13T10:00:00.000Z" }), storage);
    expect((await listRecipes(storage)).map((r) => r.name)).toEqual(["New", "Old"]);
  });
});

describe("when the photos do not fit", () => {
  const withPhotos = recipe({
    mealPhoto: "data:image/jpeg;base64,AAAA",
    ingredients: [{ ...recipe().ingredients[0], photo: "data:image/jpeg;base64,BBBB" }, recipe().ingredients[1]],
  });
  const photosTooBig = (r: Recipe) => Boolean(r.mealPhoto) || r.ingredients.some((line) => line.photo);

  it("saves the recipe without its photos and says so", async () => {
    const storage = fakeStorage(photosTooBig);
    expect(await saveRecipe(withPhotos, storage)).toBe("saved-without-photos");
    const saved = await loadRecipe("r1", storage);
    expect(saved?.mealPhoto).toBeUndefined();
    expect(saved?.ingredients[0].photo).toBeUndefined();
    expect(saved?.ingredients.map((line) => line.name)).toEqual(["flour", "salt"]);
    expect(saved?.steps).toEqual(["Mix it until smooth."]);
  });

  it("takes photos off without touching anything else", () => {
    expect(withoutPhotos(withPhotos)).toEqual(recipe());
  });

  it("reports failure, and keeps nothing, when even the plain recipe cannot be saved", async () => {
    const storage = fakeStorage(() => true);
    expect(await saveRecipe(withPhotos, storage)).toBe("failed");
    expect(await saveRecipe(recipe(), storage)).toBe("failed");
    expect(storage.kept.size).toBe(0);
  });
});
