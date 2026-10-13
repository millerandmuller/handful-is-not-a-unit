---
doc: prd
status: approved
---

# Handful Is Not a Unit: Product Requirements

An iPhone or iPad app that listens while mom talks through a family recipe and turns her rough amounts into a recipe card her 10-year-old daughter can cook from later.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

## The Core Journey
Develops `scope.md > The Core Loop`.

1. The daughter opens Handful on her iPhone or iPad and sees the recipes already captured on this iPhone or iPad, plus a **New** button.
2. She taps **New** and enters the name of the dish.
3. She props the iPhone or iPad on the counter and starts listening. Mom cooks and explains what she is adding.
4. Each time mom names an ingredient and an amount, a new line appears: the ingredient with its picture, mom's own words ("a handful of flour"), and what the app converts that to ("about ¼ cup", marked as an estimate).
5. The daughter confirms the line, or changes the amount when mom says the estimate is off. She can also snap a photo of mom adding that ingredient.
6. When the app is unsure about something it heard, it asks a question. Questions nobody answers during cooking wait in a queue.
7. When mom is done, the daughter finishes the session. The app shows the questions that were not answered, and she answers or changes them.
8. She takes a picture of the finished meal.
9. She sees the completed recipe card: the dish name, the finished meal image, every ingredient with its measurement, and the steps.

Success: someone who was not in the kitchen can cook from the card and get the same dish.

## Screens and Layout

Five surfaces, in the order the daughter meets them.

1. **Recipe list (home).** The recipes captured on this iPhone or iPad, each shown by name, and a **New** button.
2. **Name the recipe.** One input for the dish name, and a way to begin.
3. **Listening session.** The main screen. A clear sign that the iPhone or iPad is listening, the growing list of ingredient lines, and any question the app is asking right now. A way to finish.
4. **Leftover questions.** Shown after finishing: the queued questions, one at a time, and the prompt to add the finished meal image.
5. **Recipe card.** The finished recipe. Reached at the end of a session, or by tapping a recipe in the list.

## Look and Feel
In the learner's words: "homemade, mom to daughter, carefully passed on, beautifully designed; think italian, german, dutch, malaysian mixed cooking, all passed onto a smart 10-year old daughter."

- Homemade and personal, like something handed from a mother to her daughter, not like a tech product.
- Beautifully designed and made with care.
- Draws on a mixed family kitchen: Italian, German, Dutch and Malaysian cooking.
- Made for a smart 10-year-old. Assumption (agent): this means clear and warm without being babyish or cartoonish.
- Typography, exact colors and reference images were not specified. `4-spec` translates the direction above into concrete styling without asking again.

## Features and Behavior

### Recipe list
Develops a small version of `scope.md > Later` (saving a collection), brought into the proof of concept by the learner.

- Recipes finished on this iPhone or iPad stay on this iPhone or iPad and appear in the list.
- Tapping a recipe opens its card.
- **New** starts a new recipe.
  - [ ] After finishing a recipe and reopening the app, that recipe is in the list.
  - [ ] Tapping it shows the same card that was shown at the end of the session.

### Naming the recipe
- The dish name is entered at the beginning and appears as the title of the card.
  - [ ] The name typed at the start is the title on the finished card.
  - [ ] A session cannot start with an empty name.

### Listening and ingredient lines
Develops `scope.md > The Unique Kernel`.

- While the session runs, the iPhone or iPad listens to mom and the screen shows that it is listening.
- When mom names an ingredient with an amount, a line appears with: the ingredient name, a simple picture of the ingredient, mom's own words, and the converted amount.
- A rough amount ("a handful", "about a scoop", "approximately a cup") is converted to a standard kitchen measurement and marked as an estimate.
- An exact amount ("two eggs", "one cup of milk") appears as said, with no estimate mark.
- What mom says about how to cook (mixing, heating, how long, what it should look like) is kept as steps, in order, in her own words.
- Kitchen talk that is not part of the recipe does not become a line.
  - [ ] Saying "a handful of flour" produces a line showing flour, its picture, the words "a handful", and an estimated standard amount.
  - [ ] Saying "two eggs" produces a line showing 2 eggs with no estimate mark.
  - [ ] Saying something unrelated to the recipe produces no line.
  - [ ] Lines appear while mom is still cooking, not only at the end.

### Confirming or changing an amount
Develops `scope.md > The POC Boundary`. The learner asked for "whatever is easiest in terms of UI/UX"; the behavior below is the agent's proposal.

- Each estimated line has one tap to confirm it.
- Tapping the amount opens a small set of nearby amounts (less and more), and the daughter picks the right one.
- A confirmed or changed line loses its estimate mark.
- Any line can be removed if it does not belong.
  - [ ] One tap confirms an estimate and the estimate mark disappears.
  - [ ] Changing "about ¼ cup" to "½ cup" updates the line and the finished card.
  - [ ] Removing a line removes it from the finished card.

### Photos
Develops a small version of `scope.md > Later` (camera). The camera is used for keepsake photos only, never to measure.

- Each ingredient line has a button to snap a photo of mom adding it. The photo is attached to that line.
- At the end, the daughter takes one picture of the finished meal.
- Photos are optional. A recipe without them is still complete.
  - [ ] A snapped photo appears on its ingredient line and on the finished card.
  - [ ] The finished meal image appears at the top of the card.
  - [ ] Skipping all photos still produces a complete card.

### Questions from the app
- When the app is unsure what it heard (an unclear ingredient, an amount it could not convert, an ingredient with no amount), it asks a question on screen instead of guessing silently.
- The daughter can answer right away, or leave it.
- Unanswered questions wait in a queue and are shown after she finishes the session.
- Estimates she neither confirmed nor changed during cooking also join the queue.
- She can change any answer.
  - [ ] An ingredient said without an amount produces a question, not an invented amount.
  - [ ] A question ignored during cooking is shown again after finishing.
  - [ ] An estimate that was never confirmed is shown again after finishing.

### The recipe card
Develops `scope.md > What "Working" Looks Like`.

- Shows the dish name, the finished meal image, the ingredient list with measurements, and the steps in order.
- Next to each converted amount, mom's original words stay visible.
- Each ingredient shows its picture and its snapped photo if there is one.
- At the foot of the card is a short note: "The amounts on this card are estimates. Mom's own words are the real recipe. This card is not food-safety advice." Added by the learner at build planning on 2026-10-05.
  - [ ] Every ingredient on the card has a measurement.
  - [ ] No line on the finished card is still marked as an unreviewed estimate.
  - [ ] The note about estimates and food safety is at the foot of every card.
  - [ ] A person who was not in the kitchen can read the card top to bottom and know what to add, how much, and what to do.

## States and Boundaries

- **First use.** The recipe list is empty. The screen says so in a friendly way and points to **New**.
- **Listening, nothing heard yet.** The session screen shows it is listening and invites mom to start talking.
- **The iPhone or iPad is not allowed to listen.** The app explains that it needs to hear mom and how to allow it. The session does not start silently broken.
- **The iPhone or iPad cannot understand.** If it stops hearing or cannot make sense of what was said, it says so on screen and does not invent lines.
- **Camera not allowed or not used.** Photos are skipped; everything else works.
- **Finishing with nothing captured.** The app says there is nothing to make a card from and lets her keep listening or leave.
- **What persists.** Finished recipes, with their photos, stay on this iPhone or iPad.
- **What does not persist.** A session that is closed before finishing is not kept (proposed by the agent, approved at review).

## Product Decisions

- The first screen lists recipes and has a **New** button. Learner's choice: "options for different recipes mom could share with her, or a 'new' button to intake a new recipe." Small version chosen: recipes made on this iPhone or iPad only.
- The dish name is entered at the beginning. Learner's choice.
- Each line shows what mom said next to what the app converted it to, with images. Learner's choice.
- Images are a picture of the ingredient plus an optional snapped photo of mom adding it. Small version chosen by the learner: the daughter taps to snap; the app does not choose the moment.
- When the app is unsure it asks a question, and unanswered questions queue to the end where she can change them. Learner's choice.
- The session ends with a completed recipe with all measurements and a finished meal image. Learner's choice.
- The look is homemade, mom to daughter, carefully passed on, beautifully designed. Learner's choice.

Proposed by the agent and approved by the learner at review on 2026-10-04:
- The confirm and change behavior (one tap to confirm, tap the amount to pick a nearby amount). Delegated by the learner.
- If time runs short, the recipe list is dropped first and the photos second. Delegated by the learner ("do whatever makes sense"). Reason: a demo shows one recipe, so the list is the least visible part, while the photos carry the family feeling.
- The finished meal image is a photo the daughter takes, not a generated picture.
- The dish name is typed.
- Amounts are shown in cups and spoons, because the learner's examples were "approximately a cup" and "about a scoop".
- Questions appear on screen and are not read aloud.

## What We're Building
- A recipe list with **New** (first to be dropped if time runs short).
- Naming a recipe.
- A listening session that produces ingredient lines and steps from mom's speech.
- Conversion of rough amounts into estimated standard measurements, shown next to mom's words.
- Confirm, change and remove for each line.
- Questions when the app is unsure, with a queue reviewed at the end.
- A picture for each ingredient, an optional snapped photo per ingredient, and a finished meal image (photos are second to be dropped).
- The finished recipe card.

## Deferred From the POC
- **Mom sharing recipes from her own device.** Needs accounts and syncing between devices.
- **The app capturing photos by itself at the right moment.** Hard to get right; the daughter snaps instead.
- **Measuring by camera.** Cut in scope: a camera cannot reliably tell how much is in a hand.
- **Printing or sharing the card.** Not needed to prove the kernel.
- **Editing a finished recipe later.** The card is fixed once the session is finished.

## Possible Later Enhancements
- Cooking mode: following the card step by step on a later day.
- Who the recipe came from (grandma, mom) as part of the card.
- Grams and millilitres alongside cups and spoons.
- The app asking its questions out loud.

## Non-Goals
- **No accounts or logins.** One kitchen, one iPhone or iPad.
- **No measuring from video.** A confident wrong number would break the "cook it and get the same thing" test.
- **No recipe search, import from websites, or meal planning.** This captures one family's spoken recipes.
- **No nutrition or allergen information.** Outside the kernel.

## Open Questions
- Resolved at review: amounts are shown in cups and spoons.
- Should a session closed by accident be recoverable? Can wait; assumed no for the proof of concept.

## Revisions

- 2026-10-13: Every "iPad" now reads "iPhone or iPad", at the owner's decision: the product runs in Safari on an iPhone or an iPad. Wording only; behavior and the proof-of-concept boundary are unchanged.
