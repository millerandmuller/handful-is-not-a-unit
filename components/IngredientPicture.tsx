import type { ReactNode } from "react";
import { IngredientTile, TILE_COLOR } from "./IngredientTile";
import type { FoodGroup } from "@/lib/types";

// Twelve small drawings, one per food group, drawn in code so there are no
// stock photos to license. Each sits on the group's palette-colored tile,
// drawn in cream on a 48 x 48 grid.
const CREAM = "#fff8e8";

const ICONS: Record<FoodGroup, ReactNode> = {
  // A stalk of wheat.
  grain: (
    <>
      <path d="M24 42V16" stroke={CREAM} strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="24" cy="9" rx="3" ry="5" fill={CREAM} />
      <ellipse cx="17.5" cy="17" rx="3" ry="5.5" fill={CREAM} transform="rotate(-35 17.5 17)" />
      <ellipse cx="30.5" cy="17" rx="3" ry="5.5" fill={CREAM} transform="rotate(35 30.5 17)" />
      <ellipse cx="17.5" cy="26.5" rx="3" ry="5.5" fill={CREAM} transform="rotate(-35 17.5 26.5)" />
      <ellipse cx="30.5" cy="26.5" rx="3" ry="5.5" fill={CREAM} transform="rotate(35 30.5 26.5)" />
    </>
  ),
  // A milk bottle.
  dairy: (
    <>
      <path d="M20 7h8v7l5 7v19a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V21l5-7z" fill={CREAM} />
      <path d="M17 28h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
    </>
  ),
  // An egg.
  egg: <path d="M24 6c8 0 14 12 14 21a14 14 0 0 1-28 0C10 18 16 6 24 6z" fill={CREAM} />,
  // A leaf.
  vegetable: (
    <>
      <path d="M9 39C9 21 21 9 39 9c0 18-12 30-30 30z" fill={CREAM} />
      <path d="M9 39L29 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
    </>
  ),
  // An apple.
  fruit: (
    <>
      <path d="M24 17c-6-4-14 0-14 9 0 9 6 16 10 16 2 0 3-1 4-1s2 1 4 1c4 0 10-7 10-16 0-9-8-13-14-9z" fill={CREAM} />
      <path d="M24 17c0-4 2-7 5-9" stroke={CREAM} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </>
  ),
  // A drumstick.
  meat: (
    <>
      <circle cx="19" cy="19" r="12" fill={CREAM} />
      <path d="M27 27l11 11" stroke={CREAM} strokeWidth="5" strokeLinecap="round" />
      <circle cx="40" cy="36" r="3.2" fill={CREAM} />
      <circle cx="36" cy="40" r="3.2" fill={CREAM} />
    </>
  ),
  // A fish.
  fish: (
    <>
      <ellipse cx="21" cy="24" rx="15" ry="10" fill={CREAM} />
      <path d="M33 24l11-10v20z" fill={CREAM} />
      <circle cx="12.5" cy="22" r="2" fill="currentColor" opacity="0.6" />
    </>
  ),
  // A chili pepper.
  spice: (
    <>
      <path d="M11 17C27 14 40 24 37 40 24 38 12 30 11 17z" fill={CREAM} />
      <path d="M11 17l-3-6" stroke={CREAM} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // A drop of oil.
  oil: (
    <>
      <path d="M24 6S11 21 11 30a13 13 0 0 0 26 0C37 21 24 6 24 6z" fill={CREAM} />
      <path d="M18 31a6 6 0 0 0 5 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45" />
    </>
  ),
  // A glass with waves.
  liquid: (
    <>
      <path d="M12 10h24l-3 30a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2z" fill={CREAM} />
      <path d="M15 24c3-3 5 3 9 0s6 3 9 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45" />
    </>
  ),
  // A wrapped sweet.
  sweet: (
    <>
      <ellipse cx="24" cy="24" rx="10" ry="8" fill={CREAM} />
      <path d="M15 24L5 16v16z" fill={CREAM} />
      <path d="M33 24l10-8v16z" fill={CREAM} />
    </>
  ),
  // A bowl with steam, for anything else.
  other: (
    <>
      <path d="M7 23h34a17 15 0 0 1-34 0z" fill={CREAM} />
      <path d="M17 16c-3-3 3-5 0-9M25 16c-3-3 3-5 0-9M33 16c-3-3 3-5 0-9" stroke={CREAM} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </>
  ),
};

/** Whether there is a drawing for this group. Anything else falls back to the letter tile. */
export function hasPicture(foodGroup: string): foodGroup is FoodGroup {
  return Object.prototype.hasOwnProperty.call(ICONS, foodGroup);
}

/** The picture beside an ingredient: its food group's drawing, or the letter tile if there is none. */
export function IngredientPicture({ name, foodGroup }: { name: string; foodGroup: string }) {
  if (!hasPicture(foodGroup)) return <IngredientTile name={name} foodGroup="other" />;
  return (
    <span className={`tile tile--picture tile--${TILE_COLOR[foodGroup]}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" width="40" height="40" focusable="false" data-group={foodGroup}>
        {ICONS[foodGroup]}
      </svg>
    </span>
  );
}

export const PICTURE_GROUPS = Object.keys(ICONS);
