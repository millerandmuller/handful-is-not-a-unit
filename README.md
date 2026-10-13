# Handful Is Not a Unit

An iPhone or iPad on the kitchen counter listens while mom talks through a family recipe, and turns her "handfuls" and "about a scoop" into a recipe card her daughter can cook from later.

Mom says "a handful of flour". The card shows flour, her own words in handwriting, and "about ¼ cup", marked as an estimate until someone confirms or corrects it.

This is a proof of concept built for the Devpost hackathon "Build With AI: Basics". It is being built in steps; this README describes what works today.

## What works today

- Tap **Start listening** and talk: the browser's built-in speech recognition turns mom's voice into text, and ingredient lines appear while she is still talking.
- Or type or paste what mom said. Typed text takes exactly the same path as spoken words, so the app works with no microphone at all.
- Each line shows the ingredient, mom's words, and the amount.
- Rough amounts ("a handful", "a pinch") become labeled estimates. Exact amounts ("two eggs") appear as said.
- What mom says about how to cook is kept as steps, in her words.
- Kitchen talk that is not part of the recipe is ignored.
- Tap **New**, name the dish, and start. Each estimate has a **Looks right** button, the amount can be changed from a few smaller and larger ones, and any line can be removed.
- When an ingredient is said with no amount, or with a word the app does not know, the app asks a question instead of guessing. Questions left alone come back after **Finish**, together with any estimate nobody confirmed. For an ingredient mom cannot give an amount for, the choices are to pick an amount, remove the line, or keep it "as mom says": it stays on the card with mom's words and no number. If mom gave no words at all, the line says "no amount given" instead.
- **Finish** ends with the recipe card: the name, every ingredient with mom's words and its amount, the steps, and a short note that the amounts are estimates.

Still to come: pictures for each ingredient, photos, and saving recipes (a finished card is gone when the page is closed for now).

## How AI was used

**To build it.** The owner is not a programmer. She made the product decisions (what the app does, what it must never do, what to cut) and reviewed each step by trying it. The code, tests and this README were written by Claude Code, Anthropic's AI coding agent, under her direction.

**While it runs.** Google's Gemini (`gemini-3.8-flash`) reads the text of what mom said and picks out ingredients, her amount words, and steps. That is all the AI does.

**What the AI does not do.** It never decides how much "a handful" is. One rule holds the app together: **the AI reads, the app measures.** The number comes from a fixed table in `lib/measuringTable.ts`, so the same words always give the same estimate.

## About the estimates

- An amount worked out from a rough word is an estimate from a fixed table, not a measurement. A handful is taken to be ¼ cup whoever's hand it is and whatever is in it.
- Every estimate is labeled as an estimate and shown next to mom's own words. Her words are the real record.
- Estimates are meant to be corrected by the people in the kitchen.
- When the table does not know a word, the app shows that the amount is not known yet. It does not guess.
- Nothing in this app is food-safety, allergy or nutrition guidance.

## Where your words go and what is stored

| What | Where it goes | Is it stored? |
|---|---|---|
| Audio | The app never records, saves or sends audio itself. When listening is on, the browser's built-in speech recognition turns the sound into text. In Safari that recognition is provided by Apple and the audio may be processed on Apple's servers; in Chrome it is provided by Google. | Not by this app. |
| The text of what mom said | From the page to this app's own helper (`/api/understand`), which passes it to Google's Gemini API together with the names of the ingredients already on the list. | Not by this app. The helper keeps nothing. Google's handling depends on the Gemini tier: on the free tier, what is sent may be used to improve Google's products; on the paid tier it is not. |
| Photos | Not part of the app yet. | No |
| The recipe in progress and the finished card | It lives in the page's memory only. | No. Closing or reloading the page loses it. Saving finished recipes is still to come. |

There are no accounts and no database. The Gemini key stays on the server and is never part of the page.

## How to run it

You need Node.js 20 or newer and a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and put your key after `GEMINI_API_KEY=`. That file is ignored by git. Never commit a key or paste it anywhere public.

```bash
npm run dev
```

Open http://localhost:3000, tap **New**, name the dish, then type `a handful of flour and two eggs` and press **Send**.

Run the automatic checks:

```bash
npm test
```

### On an iPhone or iPad

An iPhone or iPad only lets a web page use the microphone on a secure (https) address, so the app has to be hosted. This project is hosted on Vercel, with `GEMINI_API_KEY` stored in the Vercel project's environment settings and never in the code.

1. Open the hosted address in Safari on the iPhone or iPad.
2. Go to the session screen and tap **Start listening**.
3. Allow the microphone when Safari asks.

If Safari stops listening by itself, the app starts it again. If the microphone is not allowed or the browser cannot listen, the screen says so and the typing box still works.

### What was found about listening and screen recording

Checked on 2026-10-13, on the hosted address:

- **Listening works.** On a laptop in Chrome and on an iPhone in Safari, every spoken ingredient appeared as a line and the listening sign did not drop out. Rough words became labeled estimates, and "just a little bit" became "needs an answer". Two runs were made, one per device; a separate speech service was judged not needed.
- **Recording the laptop screen works.** A screen recording made with listening on captured both the screen and the sound.
- **Recording the iPhone screen does not.** A Control Center recording with the microphone on lost its audio the moment **Start listening** was tapped, because the microphone went to the app. The app kept capturing words. To film the app, record the laptop screen, or use another device or camera to film the phone.
- The address is protected by a Vercel sign-in, so the device has to be signed in to Vercel in its browser.

## How it is put together

| Part | File |
|---|---|
| The home page and the name screen | `app/page.tsx`, `app/new/page.tsx` |
| The session screen (listening, questions, finishing) | `app/session/page.tsx` |
| The rules for lines, questions and what comes back after Finish | `lib/sessionRules.ts` |
| What a line may show (so an estimate always has its label and mom's words) | `lib/lineDisplay.ts` |
| The recipe card | `components/RecipeCard.tsx` |
| The ears (speech to text, restarts itself) | `lib/ears.ts` |
| The measuring table (rough words to estimates) | `lib/measuringTable.ts` |
| The helper on the server that holds the key | `app/api/understand/route.ts` |
| The one place that calls Gemini | `lib/server/gemini.ts` |
| The instructions given to Gemini | `lib/server/instructions.ts` |
| The check on Gemini's answer | `lib/server/checkAnswer.ts` |
| Tests | `tests/` |

Built with Next.js, TypeScript and Vitest.

## License

MIT. See [LICENSE](LICENSE).
