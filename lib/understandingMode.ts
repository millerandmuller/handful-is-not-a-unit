// Chooses, for each request, between recorded answers (demo mode) and the real
// helper. The real helper is used only while an access code is stored.

import { getAccessCode } from "./accessCode";
import { sendDemo } from "./demoUnderstanding";
import { sendToHelper } from "./understandingClient";
import type { SendToHelper } from "./understandingClient";

interface ModeSenders {
  real: SendToHelper;
  demo: SendToHelper;
  hasCode: () => boolean;
}

export function createModeSender({ real, demo, hasCode }: ModeSenders): SendToHelper {
  return (request) => (hasCode() ? real(request) : demo(request));
}

export const sendByMode: SendToHelper = createModeSender({
  real: sendToHelper,
  demo: sendDemo,
  hasCode: () => getAccessCode() !== null,
});
