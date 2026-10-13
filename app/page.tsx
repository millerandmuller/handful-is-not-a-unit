"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listRecipes } from "@/lib/recipeBox";
import type { Recipe } from "@/lib/types";

export default function HomePage() {
  // null while the recipe box is being read, so the empty message does not flash.
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);

  useEffect(() => {
    // If the box cannot be read (for example in a private window), the home page behaves as if it is empty.
    listRecipes()
      .then(setRecipes)
      .catch(() => setRecipes([]));
  }, []);

  return (
    <main className="session">
      <header className="session__header">
        <span className="session__mark">Handful</span>
        <h1 className="session__title">Recipes</h1>
      </header>

      {recipes !== null && recipes.length === 0 && (
        <p className="empty">
          No recipes here yet. Tap <strong>New</strong>, prop the screen on the counter, and catch the first one while mom cooks.
        </p>
      )}

      {recipes !== null && recipes.length > 0 && (
        <ul className="recipes">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <Link href={`/recipe/${recipe.id}`} className="recipes__item">
                <span className="recipes__name">{recipe.name}</span>
                <span className="recipes__date">{new Date(recipe.finishedAt).toLocaleDateString()}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/new" className="button button--link">
        New
      </Link>
    </main>
  );
}
