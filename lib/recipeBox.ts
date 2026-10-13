// The recipe box: finished recipes kept in the browser's own storage on this
// device. Nothing goes to a server. The storage itself is passed in, so the
// saving rules can be tested without a browser.

import { createStore, get, set, values } from "idb-keyval";
import type { Recipe } from "./types";

export interface RecipeStorage {
  put(recipe: Recipe): Promise<void>;
  get(id: string): Promise<Recipe | undefined>;
  all(): Promise<Recipe[]>;
}

export type SaveResult = "saved" | "saved-without-photos" | "failed";

/** The browser's IndexedDB, through idb-keyval. Created on first use, because it needs a browser. */
export function browserStorage(): RecipeStorage {
  const store = createStore("handful", "recipes");
  return {
    put: (recipe) => set(recipe.id, recipe, store),
    get: (id) => get<Recipe>(id, store),
    all: () => values<Recipe>(store),
  };
}

/** The same recipe with every photo taken off. The ingredients, amounts, words and steps stay. */
export function withoutPhotos(recipe: Recipe): Recipe {
  const { mealPhoto: _mealPhoto, ...rest } = recipe;
  return { ...rest, ingredients: recipe.ingredients.map(({ photo: _photo, ...line }) => line) };
}

function hasPhotos(recipe: Recipe): boolean {
  return Boolean(recipe.mealPhoto) || recipe.ingredients.some((line) => line.photo);
}

/**
 * Save a finished recipe. If the full recipe does not fit (photos can be big),
 * it is saved without its photos and the result says so. If even that fails
 * the result is "failed" and nothing was saved.
 */
export async function saveRecipe(recipe: Recipe, storage: RecipeStorage = browserStorage()): Promise<SaveResult> {
  try {
    await storage.put(recipe);
    return "saved";
  } catch {
    if (!hasPhotos(recipe)) return "failed";
  }
  try {
    await storage.put(withoutPhotos(recipe));
    return "saved-without-photos";
  } catch {
    return "failed";
  }
}

/** Saved recipes, the most recently finished first. */
export async function listRecipes(storage: RecipeStorage = browserStorage()): Promise<Recipe[]> {
  const recipes = await storage.all();
  return [...recipes].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
}

export async function loadRecipe(id: string, storage: RecipeStorage = browserStorage()): Promise<Recipe | undefined> {
  return storage.get(id);
}
