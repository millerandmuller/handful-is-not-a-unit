---
doc: spec
status: approved
---

# Handful Is Not a Unit: Technical Spec

## How This Works, In Plain Language

Handful is a web page the daughter opens in Safari on her iPhone or iPad. It has four working parts.

1. **The page on the iPhone or iPad.** Everything the daughter sees and taps: the recipe list, the listening screen, the questions, the card. It also holds the session while mom is cooking.
2. **The ears.** The iPhone or iPad's own built-in speech recognition turns mom's voice into text. No extra account or key. If it proves unreliable in the kitchen, a speech service takes over, and a box for typing or pasting text is always there as the last resort.
3. **The helper on the server.** A small program that lives on Vercel (the company hosting the page). The page sends it the text of what mom just said. The helper passes it to Google's Gemini, an AI service, with instructions to pick out ingredients, amounts, steps, and anything unclear. The helper exists for one reason: it keeps the Gemini key secret. The key is a password, and it must never be inside the page, where anyone could read it.
4. **The recipe box on the iPhone or iPad.** Finished recipes and their photos are saved in the browser's own storage on that iPhone or iPad. Nothing is saved on a server, so there are no accounts.

One rule holds it together: **the AI reads, the app measures.** Gemini only says "mom said a handful of flour". The amount shown for "a handful" comes from a fixed table inside the app, not from the AI. The same words always give the same estimate, the estimate is always labeled, and the daughter can correct it. When the table has no entry for what mom said, the app asks a question instead of guessing.

Why this shape and not something bigger: it has one outside service, one key, no database and no logins, which is the least that can still listen, understand, and remember.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. The daughter opens the page. It reads the recipe box on the iPhone or iPad and shows the saved recipes and **New**.
2. She taps **New** and types the dish name. The page keeps the name in memory.
3. She starts listening. Safari asks permission to use the microphone the first time.
4. Mom says "a handful of flour". The ears turn it into text on the iPhone or iPad.
5. The page sends that text to the helper. The helper asks Gemini and gets back a tidy answer: ingredient "flour", mom's words "a handful", kind "rough", rough word "handful", picture group "grain".
6. The page looks "handful" up in its fixed table, gets "¼ cup", and adds a line: flour, its picture, "a handful", "about ¼ cup", labeled estimate.
7. The daughter taps to confirm, or taps the amount and picks a nearby one. She may tap the camera button; the iPhone or iPad camera opens, and the photo is attached to that line.
8. If Gemini reports something unclear, or the table has no entry, a question appears. Unanswered questions stay in the queue.
9. She taps **Finish**. The page shows each leftover question and each unconfirmed estimate, then asks for a photo of the finished meal.
10. The page saves the recipe and its photos into the recipe box and shows the card.

## Stack

| Piece | Choice | Why |
|---|---|---|
| Language | TypeScript | A stricter form of JavaScript that catches many mistakes before the app runs. |
| Framework | Next.js (App Router), current stable release at build time. Docs: https://nextjs.org/docs | One project holds both the page and the helper, it runs on the laptop with one command, and Vercel hosts it without extra setup. |
| Styling | Plain CSS with CSS variables | No extra library; enough for five screens. |
| Speech to text | Web Speech API built into Safari (`webkitSpeechRecognition`). Docs: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API | Owner's decision: no extra account or key. |
| Understanding | Gemini API, model `gemini-3.8-flash`, via the `@google/genai` library. Docs: https://ai.google.dev/gemini-api/docs | One AI service that reads text now and can also take audio if the built-in ears fail. |
| Saving recipes | IndexedDB (browser storage) via the small `idb-keyval` library. Docs: https://github.com/jakearchibald/idb-keyval | Photos are too large for the simpler browser storage. |
| Tests | Vitest. Docs: https://vitest.dev | Checks the measuring table and session rules automatically. |
| Hosting | Vercel. Docs: https://vercel.com/docs | Owner's decision. Gives the secure address the iPhone or iPad microphone requires. |

Checked on 2026-10-05 against Google's documentation: the model name, the request shape in `External Services and Dependencies`, and the prices.

Not verified, to check early in the build:
- Whether the built-in speech recognition in Safari on iPhone or iPad keeps listening through a whole cooking session. This is the least certain piece of the whole plan.
- The exact current Next.js and `@google/genai` version numbers.
- ~~The audio format an iPhone or iPad records in, and whether Gemini accepts it.~~ Not needed: the speech service fallback was not needed (see Revisions).

## Where It Runs and How Someone Tries It

- **Runs in:** Safari on an iPhone or iPad, served from Vercel over a secure (https) address. Also works in Chrome or Safari on the laptop for development and as a recording fallback.
- **Needs:** Node.js 20 or newer on the laptop (version 25 is installed), and one secret, `GEMINI_API_KEY`.
- **Where the key lives:** on the laptop in a file named `.env.local`, which git ignores; on Vercel in the project's environment settings. Never in the page, never in a commit, never in chat.
- **Start it on the laptop:** `npm install`, then `npm run dev`, then open `http://localhost:3000`. The microphone works on this address on the laptop.
- **Run the checks:** `npm test`.
- **Put it online:** `vercel` for a preview address, `vercel --prod` for the final one. The agent asks before every deploy.
- **Try it on the iPhone or iPad:** open the Vercel address in Safari, allow the microphone, tap **New**.
- **For the demo video:** record the laptop screen with sound (screen recording with listening on) while a recipe is talked through, using the same Vercel address. Recording the iPhone or iPad screen does not work: see Revisions.
- Submission needs the demo video and a public GitHub repository. The Vercel address is an extra, not a replacement for either.

## Look and Feel
Carried from `prd.md > Look and Feel`: homemade, mom to daughter, carefully passed on, beautifully designed, a mixed Italian, German, Dutch and Malaysian kitchen, for a smart 10-year-old.

- **Feeling:** a well-loved family recipe card, not a tech dashboard. Calm and spacious.
- **Paper:** warm cream background with a slightly darker card surface and soft edges.
- **Palette, one color from each kitchen:** tomato red (Italian), Delft blue (Dutch), mustard (German), pandan green (Malaysian), on dark brown ink. Delft blue is the main action color; tomato red marks estimates and questions.
- **Lettering:** a warm serif for titles (Fraunces), a handwriting face for mom's own words (Caveat), and a clear rounded face for everything the daughter has to read quickly (Nunito). All three are free Google Fonts, bundled at build time.
- **Mom's words are always in the handwriting face and in quotes,** so it is obvious which words are hers and which numbers are the app's.
- **Decoration:** one thin patterned border on the recipe card, inspired by tile and batik patterns, drawn in code. No photographs other than the family's own.
- **For hands that are busy:** large tap targets (at least 56 px), large text readable from a step away, few things on screen at once.
- **Tone of the words:** friendly and direct, never babyish. "I didn't catch how much salt. How much was it?"

## Components

### Recipe list screen
Shows saved recipes by name and the **New** button; shows a friendly empty message on first use. Reads from the Recipe box.
PRD ref: `prd.md > Recipe list`, `prd.md > States and Boundaries`.

### Name screen
One text box for the dish name. Will not continue while the name is empty. Passes the name to the Session screen.
PRD ref: `prd.md > Naming the recipe`.

### Session screen
The main screen. Shows the listening sign, the ingredient lines, the steps heard so far, the current question, the type-or-paste box, and **Finish**. It owns the session while it is running and connects the Ears, the Understanding client and the Session rules.
PRD ref: `prd.md > Listening and ingredient lines`, `prd.md > Questions from the app`.

### Ears (speech to text)
Starts and stops the built-in speech recognition, restarts it when Safari stops it by itself, and hands finished phrases to the Session screen. Reports clearly when listening is not allowed or not available.
PRD ref: `prd.md > Listening and ingredient lines`, `prd.md > States and Boundaries`.

### Type-or-paste box
A text box on the Session screen. Whatever is typed or pasted goes through exactly the same path as spoken text. Always present, so the app works even with no microphone.
PRD ref: `prd.md > States and Boundaries` (the iPhone or iPad cannot understand).

### Understanding client
Collects new phrases, sends them to the helper one request at a time, and returns the tidy answer. Tells the helper which ingredients are already on the list so they are not added twice.
PRD ref: `prd.md > Listening and ingredient lines`.

### Helper on the server (`/api/understand`)
Receives text, calls Gemini with the instructions and the answer format, checks the answer, and returns it. Holds the key. Refuses text longer than 2,000 characters.
PRD ref: `prd.md > Listening and ingredient lines`, `prd.md > Questions from the app`.

### Measuring table
The fixed table that turns rough words into estimates (handful, pinch, dash, splash, scoop, spoonful, and similar), and the ladder of common amounts used for "less" and "more". Pure rules, no AI, covered by tests.
PRD ref: `prd.md > Listening and ingredient lines`, `prd.md > Confirming or changing an amount`.

### Session rules
The rules for what happens to the session: add a line, confirm, change, remove, add a question, answer a question, and work out what is still left over at the end. Pure rules, no screen code, covered by tests.
PRD ref: `prd.md > Confirming or changing an amount`, `prd.md > Questions from the app`.

### Line display rule
One small rule that decides what a line shows: the amount text (or "as mom says"), whether the estimate label is on, and mom's words. The Ingredient line and the Recipe card screen draw only from it, so an estimate is never shown without its label and mom's own words. Pure rule, covered by a named test. Added at build planning on 2026-10-05.
PRD ref: `prd.md > Listening and ingredient lines`, `prd.md > The recipe card`.

### Ingredient line
One row: picture, ingredient name, mom's words, amount, estimate label, confirm button, camera button, remove button.
PRD ref: `prd.md > Listening and ingredient lines`, `prd.md > Confirming or changing an amount`.

### Amount picker
Opens when the amount is tapped. Shows the current amount with a few smaller and larger ones from the ladder.
PRD ref: `prd.md > Confirming or changing an amount`.

### Question card
Shows one question with a way to answer it (pick an amount, or type a short answer) or leave it for later.
PRD ref: `prd.md > Questions from the app`.

### Leftover questions screen
Shown after **Finish**. Walks through unanswered questions and unconfirmed estimates one at a time, then asks for the finished meal photo. For an ingredient with no amount the daughter can pick an amount, remove the line, or keep it "as mom says" (the line stays with mom's words and no number). If nothing was captured, says so and offers to keep listening or leave.
PRD ref: `prd.md > Questions from the app`, `prd.md > States and Boundaries`.

### Ingredient picture
A small drawn icon chosen by food group (grain, dairy, egg, vegetable, fruit, meat, fish, spice, oil, liquid, sweet, other), drawn in code in the app's own style. If the pictures are cut, a colored tile with the ingredient's first letter takes their place.
PRD ref: `prd.md > Listening and ingredient lines`.

### Photo button
Opens the iPhone or iPad camera through the browser's standard photo picker, shrinks the photo to a sensible size, and attaches it to a line or to the recipe as the finished meal image. Photos stay on the iPhone or iPad.
PRD ref: `prd.md > Photos`.

### Recipe card screen
The finished recipe: name, meal image, ingredients with amounts (or "as mom says") and mom's words, steps in order, and at the foot the short note "The amounts on this card are estimates. Mom's own words are the real recipe. This card is not food-safety advice."
PRD ref: `prd.md > The recipe card`.

### Recipe box (saving)
Saves, lists and loads finished recipes on the iPhone or iPad.
PRD ref: `prd.md > Recipe list`, `prd.md > States and Boundaries` (what persists).

## Data Model

**Recipe** (saved in the Recipe box on the iPhone or iPad when the session is finished)
- `id`, `name`, `finishedAt`
- `mealPhoto` (optional image)
- `ingredients`: list of Ingredient lines
- `steps`: list of sentences, in order, in mom's words

**Ingredient line**
- `id`, `name`, `foodGroup`
- `saidWords`: exactly what mom said, for example "a handful"
- `amount`: quantity and unit, for example "¼" and "cup"; empty while unknown
- `status`: `exact` (mom gave a real amount), `estimate` (from the table, not yet reviewed), `confirmed`, `changed`, `needs-answer`, or `as-moms-says` (no amount; the line shows mom's own words and no number, and is not an estimate)
- `photo` (optional image)

**Question**
- `id`, `kind` (`missing-amount`, `unknown-rough-word`, `unclear-ingredient`), `text`, the line it belongs to if any, `answered`

Where each piece lives:
- **A session in progress** lives in the page's memory only. Closing the page before finishing loses it (approved in the PRD).
- **Finished recipes and photos** live in the browser's storage on that iPhone or iPad. They survive closing and reopening Safari. They do not appear on any other device, and clearing Safari's website data deletes them.
- **Nothing** is stored on the server.

## File Structure

```
product/
├── app/
│   ├── layout.tsx              # Shared page frame and fonts
│   ├── globals.css             # Colors, lettering, paper look
│   ├── page.tsx                # Recipe list screen
│   ├── new/page.tsx            # Name screen
│   ├── session/page.tsx        # Session screen and Leftover questions screen
│   ├── recipe/[id]/page.tsx    # Recipe card screen
│   └── api/understand/route.ts # Helper on the server
├── components/
│   ├── IngredientLine.tsx
│   ├── AmountPicker.tsx
│   ├── QuestionCard.tsx
│   ├── ListeningSign.tsx
│   ├── TypeOrPasteBox.tsx
│   ├── IngredientPicture.tsx
│   ├── PhotoButton.tsx
│   └── RecipeCard.tsx
├── lib/
│   ├── types.ts                # Recipe, Ingredient line, Question
│   ├── measuringTable.ts       # Rough words to estimates, and the amount ladder
│   ├── sessionRules.ts         # What happens to a session (pure rules)
│   ├── lineDisplay.ts          # What a line shows: amount, estimate label, mom's words
│   ├── ears.ts                 # Built-in speech recognition
│   ├── understandingClient.ts  # Sends text to the helper
│   ├── recipeBox.ts            # Saving and loading on the iPhone or iPad
│   ├── photo.ts                # Shrinking photos
│   └── server/
│       ├── gemini.ts           # The one place that calls Gemini
│       ├── checkAnswer.ts      # Refuses an answer from Gemini that is not in the agreed shape
│       └── instructions.ts     # Instructions and answer format for Gemini
├── tests/
│   ├── measuringTable.test.ts
│   ├── checkAnswer.test.ts
│   ├── understandingClient.test.ts
│   ├── sessionRules.test.ts
│   └── lineDisplay.test.ts
├── devpost/                    # Devpost learning workspace
├── .env.example                # Shows the key's name, with no value
├── DECISION_LOG.md
├── LICENSE                     # MIT
├── README.md                   # AI use, estimate caveat, where audio and text go, how to run, license
└── package.json
```

## External Services and Dependencies

### Gemini API (the only outside AI service)
- **Docs:** https://ai.google.dev/gemini-api/docs
- **Key:** `GEMINI_API_KEY`, read only by `lib/server/gemini.ts`.
- **Call** (shape checked against Google's documentation on 2026-10-05):

```ts
const interaction = await client.interactions.create({
  model: "gemini-3.8-flash",
  input: instructionsAndText,
  response_format: { type: "text", mime_type: "application/json", schema: answerSchema },
});
const answer = JSON.parse(interaction.output_text);
```

- **Sent:** the new text mom said, the names of ingredients already on the list, and the instructions. No audio, no photos, no names of people.
- **Answer format:**

```json
{
  "ingredients": [
    { "name": "flour", "foodGroup": "grain", "saidWords": "a handful",
      "amountKind": "rough", "roughWord": "handful", "quantity": null, "unit": null }
  ],
  "steps": ["Mix it until it comes together."],
  "questions": [
    { "kind": "missing-amount", "ingredientName": "salt", "text": "How much salt was it?" }
  ]
}
```

- `amountKind` is `exact`, `rough` or `missing`. For `exact`, `quantity` and `unit` are filled. For `rough`, `roughWord` is filled and the app's Measuring table supplies the number; `quantity` then only counts how many of the rough word mom said ("two handfuls" is 2), and the table does the multiplying.
- **Cost:** paid tier $0.75 per million tokens in and $3.75 per million out. A whole recipe session should cost well under a dollar. A spending cap is set on the Google account (owner's condition).
- **Privacy:** on Google's free tier, what is sent may be used to improve Google's products; on the paid tier it is not. Because this is a family kitchen with a child, the paid tier is recommended.

### Our own helper: `POST /api/understand`
- **Sent:** `{ "newText": string, "knownIngredients": string[] }`
- **Returns:** the answer format above, or `{ "error": string }` with a plain message.

### Built-in speech recognition
- No key. In Safari the recognition is provided by Apple, and audio may be processed on Apple's servers.

### Vercel
- Hosts the page and the helper. Free tier. Holds `GEMINI_API_KEY` in environment settings.

### Speech service fallback (built only if the kitchen test fails)
- The page records short pieces of audio and a second helper, `/api/transcribe`, sends them to Gemini with the same key. Audio is $0.005 per minute. The audio format must be verified first.

## Important Failure Modes

- **The built-in ears stop or mishear in a noisy kitchen** → the listening sign shows "not listening", listening restarts by itself, and the type-or-paste box is always there. If the three-times kitchen test fails, the speech service fallback is built.
- **The iPhone or iPad is not allowed to use the microphone** → a plain message explains how to allow it in Safari, and the type-or-paste box still works.
- **Gemini is slow, unreachable, or returns something unusable** → the line of text is kept and retried once; if it still fails, a small "couldn't understand that, try again" message appears and no line is invented.
- **A rough word the table does not know** → a question, never a guess.
- **Photos fill the iPhone or iPad's browser storage** → photos are shrunk before saving; if saving a photo fails, the recipe is saved without it and the daughter is told.

## What Was Simplified and Why

- **A fixed measuring table** instead of the AI judging each amount. The same words always give the same estimate, and it can be tested. The fuller version would consider the ingredient (a handful of spinach is not a handful of flour); here the daughter's correction covers that.
- **Recipes saved on one iPhone or iPad** instead of shared between devices. Sharing would need accounts and a database.
- **The daughter snaps photos** instead of the app choosing the moment. Automatic capture would need live video analysis.
- **Drawn food-group icons** instead of a picture for every ingredient. Owner's decision to avoid stock photos and their copyright risks.
- **New lines only.** If mom adds more of something already listed, the app does not merge it; it may ask a question. Merging would need the AI to edit existing lines.
- **No sign-in on the public address.** Protection is the secret key on the server, the 2,000-character limit and the spending cap. See open issues.

## Decisions and Open Issues

**Owner's decisions**
- Web app in Safari, hosted on Vercel. The key is stored only in Vercel's environment settings, a spending cap is set, and the agent asks before it deploys.
- Listening: the iPhone or iPad's built-in speech recognition first, tested three times in the kitchen; a speech service if it fails; typing or a pasted transcript as the fallback.
- One AI service for understanding, to keep keys and data leaving the device to a minimum.
- Ingredient pictures are plain illustrations or text labels, not stock photos.
- Cut order if hours run short: saved recipe list, then photos on every ingredient, then ingredient pictures. Mom's words stay visible and every estimate stays labeled. This replaces the two-step order in `prd.md > Product Decisions`.

**Agent's recommendations, agreed by the owner at review on 2026-10-05**
- Gemini as the one AI service. Gemini is recommended because it can also take audio, so the speech fallback needs no second service. Tradeoff: mom's words go to Google.
- The paid Gemini tier, for privacy.
- Next.js and TypeScript as the way the app is built.
- The fixed measuring table ("the AI reads, the app measures").
- Drawn food-group icons as the source of ingredient pictures.

**The one genuine uncertainty**
- Whether the iPhone or iPad's built-in speech recognition is good enough in a real kitchen. The owner's plan settles it by evidence: it is built and tested first, three times in the kitchen, before the rest depends on it. A pass means lines appear for at least most of what was said in each of the three runs; the result is written into the decision log. **Settled 2026-10-13: passed** (see Revisions).

**Open issues**
- The Vercel address is public. Anyone who finds it could use the helper until the spending cap stops them. Vercel can require a Vercel sign-in to open the page, at no cost and with no code. Owner to decide whether to switch that on; it can wait until the first deploy.
- Carried from `prd.md > Open Questions`: recovering a session closed by accident stays out of the proof of concept.

## Revisions

- 2026-10-13: Every "iPad" now reads "iPhone or iPad", at the owner's decision: the product runs in Safari on an iPhone or an iPad. The wording was changed in this document, `scope.md`, `prd.md`, `checklist.md` and `README.md`; the design is unchanged.
- 2026-10-13: The speech service fallback is not needed. Learner check results: on a laptop in Chrome and on an iPhone in Safari, both on the sign-in protected Vercel address, all spoken ingredients appeared as lines and the listening sign did not drop out. Rough words became labeled estimates, and "just a little bit" became "needs an answer". The built-in speech recognition stays the only way of listening, with the typing box as the last resort. The Gemini audio path described under External Services stays unused.
- 2026-10-13: The demo video is recorded from the laptop. A laptop screen recording with listening on captured both the screen and the audio. On the iPhone, a Control Center recording with the microphone on lost its audio as soon as **Start listening** was tapped, because the microphone went to the app; the app kept capturing words. This replaces the iPhone or iPad recording plan in `Where It Runs and How Someone Tries It`.
- 2026-10-13: A fifth line status, `as-moms-says`, was added to `Data Model`, and the `Leftover questions screen`, `Recipe card screen` and `Line display rule` components were changed to match the PRD revision of the same date: at **Finish** the daughter may keep an ingredient with no amount "as mom says" instead of picking an amount or removing it. No number is shown for such a line and it is never an estimate.
- 2026-10-13: A line kept at **Finish** shows "as mom says" beside mom's words; with no words from mom it shows "no amount given". Refines the "as mom says" revision above; also in `checklist.md`.
- 2026-10-14: Removed the sentence saying the owner holds both a Claude API account and a Gemini key from `Agent's recommendations`, at the owner's request. Wording only; the choice of Gemini and its reasons are unchanged.
