// Demo mode: reads only the recorded sample sentences. It makes no network
// request at all, so nothing typed or said in demo mode leaves the page.

import { RECORDED_ANSWERS } from "./demo/recordedAnswers";
import { UnderstandingRefused } from "./understandingClient";
import type { SendToHelper } from "./understandingClient";

export const DEMO_ONLY_SAMPLES_MESSAGE =
  "Demo mode: only the sample sentences are read. Add an access code to type your own.";

/** The recorded answer for an exact sample sentence; anything else is refused. */
export const sendDemo: SendToHelper = async (request) => {
  const recorded = Object.hasOwn(RECORDED_ANSWERS, request.newText) ? RECORDED_ANSWERS[request.newText] : undefined;
  if (!recorded) throw new UnderstandingRefused(DEMO_ONLY_SAMPLES_MESSAGE);
  // A copy, so the page can never change the recording.
  return structuredClone(recorded);
};
