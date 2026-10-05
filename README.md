# Handful Is Not a Unit

An iPad on the kitchen counter listens while mom talks through a family recipe, and turns her "handfuls" and "about a scoop" into a recipe card her daughter can cook from later.

Mom says "a handful of flour". The card shows flour, her own words in handwriting, and "about ¼ cup", marked as an estimate until someone confirms or corrects it.

This is a proof of concept built for the Devpost hackathon "Build With AI: Basics". It is being built in steps; this README describes what works today.

## What works today

- Type or paste what mom said, and ingredient lines appear: the ingredient, mom's words, and the amount.
- Rough amounts ("a handful", "a pinch") become labeled estimates. Exact amounts ("two eggs") appear as said.
- What mom says about how to cook is kept as steps, in her words.
- Kitchen talk that is not part of the recipe is ignored.

Still to come: listening through the microphone, confirming and changing amounts, questions from the app, the finished recipe card, pictures, photos, and the saved recipe list.

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
| Audio | The app does not record or handle audio yet; listening is the next step. | No |
| The text of what mom said | From the page to this app's own helper (`/api/understand`), which passes it to Google's Gemini API together with the names of the ingredients already on the list. | Not by this app. The helper keeps nothing. Google's handling depends on the Gemini tier: on the free tier, what is sent may be used to improve Google's products; on the paid tier it is not. |
| Photos | Not part of the app yet. | No |
| The recipe in progress | It lives in the page's memory only. | No. Closing or reloading the page loses it. |

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

Open http://localhost:3000, type `a handful of flour and two eggs`, and press **Send**.

Run the automatic checks:

```bash
npm test
```

## How it is put together

| Part | File |
|---|---|
| The session screen | `app/session/page.tsx` |
| The measuring table (rough words to estimates) | `lib/measuringTable.ts` |
| The helper on the server that holds the key | `app/api/understand/route.ts` |
| The one place that calls Gemini | `lib/server/gemini.ts` |
| The instructions given to Gemini | `lib/server/instructions.ts` |
| The check on Gemini's answer | `lib/server/checkAnswer.ts` |
| Tests | `tests/` |

Built with Next.js, TypeScript and Vitest.

## License

MIT. See [LICENSE](LICENSE).
