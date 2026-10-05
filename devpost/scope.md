---
doc: scope
status: approved
---

# Handful Is Not a Unit

An iPad on the kitchen counter listens while mom talks through a family recipe, and turns her "handfuls" and "about a scoop" into a recipe card her daughter can cook from later.

## The Unique Kernel
The recipe has never had measurements. Grandma showed it, mom learned it by watching, and mom also cooks without measuring. Handful listens for every rough amount mom says out loud ("a handful", "approximately a cup", "about a scoop") and resolves it into a measurement on the card, so the recipe can be repeated by someone who was not in the room.

## Who It's For
A mom teaching her 10-year-old daughter a dish her own mother taught her. The daughter runs the app: she props her iPad on the counter while mom cooks and explains. Today the recipe lives only in mom's hands and memory, and it is passed on by watching.

## The Core Loop
1. The daughter props the iPad on the counter and starts a recipe.
2. Mom cooks and explains what she is adding, in her own rough amounts.
3. The iPad listens. Each time mom says an amount, the app tracks it.
4. The daughter sees it land and confirms ("great, okay").
5. At the end there is a recipe card with the ingredients, the measurements, and the steps.

They come back for the next family recipe.

## Inspiration & Identity
Not discussed yet. The only direction so far is the setting: a family kitchen, a child holding the device, a parent with busy hands. To be filled in during the PRD.

## Why This Matters to the Learner
"It's exciting to have something daughter will be able to use to cook with as she gets older and eventually cooks for her kids, so she can carry on the recipe(s)."

## What "Working" Looks Like
The demo shows mom explaining the recipe to her daughter as she makes it, and the app resolves all of the measurements. In the learner's words: "Someone sees the measurements of the recipe, such that when they go and cook with it, they get the same thing."

The memorable beat: mom says "a handful of flour", and a real amount appears on the card next to her words.

## The POC Boundary
- One recipe, one cooking session, on one iPad.
- The app listens to mom's speech and turns it into text.
- It pulls out ingredients, rough amounts, and steps.
- It turns each rough amount into a standard measurement, shown as an estimate next to mom's own words.
- The daughter can confirm each amount, or correct it when mom says the estimate is off.
- A finished recipe card on screen that can be read and cooked from.

## Later
- Working out amounts by watching mom through the camera.
- Saving a collection of family recipes.
- Printing or sharing the card.
- Cooking from the card step by step on a later day.

## Explicitly Cut
- **Live video measuring.** A camera cannot reliably tell how much is in a hand, and a confident wrong number would break the "cook it and get the same thing" test. It is also far beyond 2–4 hours of work.
- **Accounts and logins.** Not needed to prove the kernel.
- **Multiple cooks or multiple devices.** One kitchen, one iPad.

## Confirmed at Review
Two points were proposed by the agent and approved by the learner with the rest of the scope on 2026-10-04:
1. The camera is moved to "Later".
2. How a rough amount becomes a number: the app estimates a standard measurement from mom's words (for example "a handful" becomes roughly a quarter cup), labels it as an estimate, and lets the daughter correct it. An estimate from words alone will not guarantee the same dish; the correction step is what makes the card trustworthy.
