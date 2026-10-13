"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { loadRecipe } from "@/lib/recipeBox";
import type { Recipe } from "@/lib/types";

type Loaded = { state: "loading" } | { state: "found"; recipe: Recipe } | { state: "missing" };

/** A saved recipe, shown as the same card that was shown at the end of the session. */
export default function SavedRecipePage() {
  const { id } = useParams<{ id: string }>();
  const [loaded, setLoaded] = useState<Loaded>({ state: "loading" });

  useEffect(() => {
    loadRecipe(id)
      .then((recipe) => setLoaded(recipe ? { state: "found", recipe } : { state: "missing" }))
      .catch(() => setLoaded({ state: "missing" }));
  }, [id]);

  if (loaded.state === "loading") return <main className="session" />;

  return (
    <main className="session">
      {loaded.state === "found" ? (
        <RecipeCard name={loaded.recipe.name} ingredients={loaded.recipe.ingredients} steps={loaded.recipe.steps} />
      ) : (
        <p className="empty">This recipe is not on this device. It may have been saved on another one, or the browser's saved data was cleared.</p>
      )}
      <Link href="/" className="button button--quiet button--link">
        Home
      </Link>
    </main>
  );
}
