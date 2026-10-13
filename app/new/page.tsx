"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** The first step of a recipe: its name. Nothing starts without one. */
export default function NewRecipePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const trimmed = name.trim();

  function begin(event: React.FormEvent) {
    event.preventDefault();
    if (trimmed === "") return;
    router.push(`/session?name=${encodeURIComponent(trimmed)}`);
  }

  return (
    <main className="session">
      <header className="session__header">
        <span className="session__mark">Handful</span>
        <h1 className="session__title">What are we making?</h1>
      </header>

      <form className="typebox" onSubmit={begin}>
        <label className="typebox__label" htmlFor="recipe-name">
          Name of the dish
        </label>
        <div className="typebox__row">
          <input id="recipe-name" className="field" value={name} onChange={(event) => setName(event.target.value)} autoFocus autoComplete="off" />
          <button type="submit" className="button" disabled={trimmed === ""}>
            Start
          </button>
        </div>
        {trimmed === "" && <p className="typebox__hint">Give the dish a name to begin.</p>}
      </form>
    </main>
  );
}
