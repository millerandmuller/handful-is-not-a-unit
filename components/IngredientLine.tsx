"use client";

import { useState } from "react";
import { AmountPicker } from "@/components/AmountPicker";
import { IngredientTile } from "@/components/IngredientTile";
import { lineDisplay } from "@/lib/lineDisplay";
import type { Amount, IngredientLine as Line } from "@/lib/types";

interface IngredientLineProps {
  line: Line;
  onConfirm: (id: string) => void;
  onChange: (id: string, amount: Amount) => void;
  onRemove: (id: string) => void;
}

/** One row: picture, ingredient, mom's own words, the amount, and what can be done with it. */
export function IngredientLine({ line, onConfirm, onChange, onRemove }: IngredientLineProps) {
  const [picking, setPicking] = useState(false);
  // Everything shown about the amount comes from lineDisplay, nothing is decided here.
  const shown = lineDisplay(line);

  return (
    <li className="line line--new">
      <IngredientTile name={line.name} foodGroup={line.foodGroup} />
      <div className="line__what">
        <span className="line__name">{line.name}</span>
        {shown.saidWords && <span className="moms-words">{shown.saidWords}</span>}
      </div>
      <div className="line__amount">
        {shown.amountText && line.amount ? (
          <button
            type="button"
            className="line__number line__number--button"
            aria-expanded={picking}
            aria-label={`${line.name}: ${shown.amountText}. Change the amount`}
            onClick={() => setPicking((open) => !open)}
          >
            {shown.amountText}
          </button>
        ) : shown.asMomsSays || shown.noAmountGiven ? (
          <span className="line__number line__number--unknown">{shown.asMomsSays ? "as mom says" : "no amount given"}</span>
        ) : (
          <span className="line__number line__number--unknown">amount not known yet</span>
        )}
        {shown.showEstimateLabel && <span className="label">estimate</span>}
        {shown.needsAnswer && <span className="label">needs an answer</span>}
      </div>

      <div className="line__actions">
        {shown.showEstimateLabel && (
          <button type="button" className="button" onClick={() => onConfirm(line.id)}>
            Looks right
          </button>
        )}
        <button type="button" className="button button--quiet" aria-label={`Remove ${line.name}`} onClick={() => onRemove(line.id)}>
          Remove
        </button>
      </div>

      {picking && line.amount && (
        <AmountPicker
          current={line.amount}
          onPick={(amount) => {
            onChange(line.id, amount);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </li>
  );
}
