// The ears: the browser's built-in speech recognition.
// Safari stops listening by itself every so often, so this restarts it, and
// it says clearly when listening is not allowed or not available.

export type EarsState =
  | "off" // not started, or paused by the daughter
  | "listening"
  | "stopped" // it kept failing; a tap is needed to start again
  | "not-allowed" // the browser may not use the microphone
  | "not-available"; // this browser has no speech recognition

// The small part of the browser's SpeechRecognition that the ears use.
export interface Recognizer {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognizerResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export interface RecognizerResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

export interface EarsListener {
  /** A finished phrase, ready to be understood. */
  onPhrase(text: string): void;
  /** What is being heard right now, before the phrase is finished. */
  onHearing(text: string): void;
  onState(state: EarsState): void;
}

export interface Ears {
  start(): void;
  stop(): void;
}

export interface EarsOptions {
  /** Returns a fresh recognizer, or null when the browser has none. */
  createRecognizer?: () => Recognizer | null;
  lang?: string;
}

const RESTART_DELAY_MS = 300;
// A run shorter than this counts as a failed start, not as real listening.
const SHORT_RUN_MS = 1500;
// This many failed starts in a row and the ears stop trying by themselves.
const MAX_SHORT_RUNS = 4;
const NOT_ALLOWED_ERRORS = ["not-allowed", "service-not-allowed"];

type RecognizerClass = new () => Recognizer;

/** The browser's own recognizer, or null (Safari uses the webkit name). */
export function browserRecognizer(): Recognizer | null {
  if (typeof window === "undefined") return null;
  const speech = window as unknown as { SpeechRecognition?: RecognizerClass; webkitSpeechRecognition?: RecognizerClass };
  const Recognition = speech.SpeechRecognition ?? speech.webkitSpeechRecognition;
  return Recognition ? new Recognition() : null;
}

export function createEars(listener: EarsListener, options: EarsOptions = {}): Ears {
  const createRecognizer = options.createRecognizer ?? browserRecognizer;
  const lang = options.lang ?? "en-US";

  let wanted = false; // the daughter wants the ears on
  let recognizer: Recognizer | null = null;
  let startedAt = 0;
  let shortRuns = 0;
  let unfinished = ""; // heard but not yet marked finished by the browser
  let restartTimer: ReturnType<typeof setTimeout> | null = null;

  function giveUp(state: EarsState) {
    wanted = false;
    recognizer = null;
    listener.onHearing("");
    listener.onState(state);
  }

  function handOverUnfinished() {
    // Safari sometimes ends without ever marking the last words finished.
    const text = unfinished.trim();
    unfinished = "";
    listener.onHearing("");
    if (text) listener.onPhrase(text);
  }

  function handleResult(event: RecognizerResultEvent) {
    let hearing = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const text = result[0].transcript.trim();
      if (!result.isFinal) {
        hearing = `${hearing} ${text}`.trim();
      } else if (text) {
        listener.onPhrase(text);
      }
    }
    unfinished = hearing;
    listener.onHearing(hearing);
  }

  function handleEnd() {
    recognizer = null;
    handOverUnfinished();
    if (!wanted) return;

    shortRuns = Date.now() - startedAt < SHORT_RUN_MS ? shortRuns + 1 : 0;
    if (shortRuns >= MAX_SHORT_RUNS) {
      giveUp("stopped");
      return;
    }
    restartTimer = setTimeout(listen, RESTART_DELAY_MS);
  }

  function listen() {
    restartTimer = null;
    if (!wanted) return;

    const next = createRecognizer();
    if (!next) {
      giveUp("not-available");
      return;
    }
    next.continuous = true;
    next.interimResults = true;
    next.lang = lang;
    next.onresult = handleResult;
    next.onerror = (event) => {
      // Other errors ("no-speech", "network", "aborted") are followed by an
      // end, and the end decides whether to try again.
      if (NOT_ALLOWED_ERRORS.includes(event.error)) giveUp("not-allowed");
    };
    next.onend = handleEnd;

    recognizer = next;
    startedAt = Date.now();
    try {
      next.start();
    } catch {
      // start() can throw when the browser is not ready yet; treat it like a run that ended at once.
      handleEnd();
    }
  }

  return {
    start() {
      if (wanted) return;
      wanted = true;
      shortRuns = 0;
      listener.onState("listening");
      listen();
    },
    stop() {
      wanted = false;
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = null;
      listener.onState("off");
      // Stopping lets the browser finish the last words; the end hands them over.
      if (recognizer) recognizer.stop();
      else handOverUnfinished();
    },
  };
}
