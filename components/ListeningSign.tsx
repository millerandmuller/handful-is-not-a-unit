import type { EarsState } from "@/lib/ears";

interface ListeningSignProps {
  state: EarsState;
  /** What is being heard right now, before the phrase is finished. */
  hearing: string;
  onStart: () => void;
  onStop: () => void;
}

const MESSAGE: Record<EarsState, string> = {
  off: "Not listening",
  listening: "Listening. Mom can start talking.",
  stopped: "I stopped listening. Tap to start again.",
  "not-allowed": "I'm not allowed to use the microphone.",
  "not-available": "This browser can't listen.",
};

function HelpText({ state }: { state: EarsState }) {
  if (state === "not-allowed") {
    return (
      <p className="sign__help">
        To hear mom, I need the microphone. In Safari, tap the button at the left of the address bar, choose{" "}
        <strong>Website Settings</strong>, set <strong>Microphone</strong> to <strong>Allow</strong>, then reload this
        page. Until then you can type what mom says in the box below.
      </p>
    );
  }
  if (state === "not-available") {
    return <p className="sign__help">You can still type or paste what mom says in the box below.</p>;
  }
  return null;
}

/** The clear sign that the device is, or is not, listening. */
export function ListeningSign({ state, hearing, onStart, onStop }: ListeningSignProps) {
  const isListening = state === "listening";
  const canStart = state !== "not-available";

  return (
    <div className={`sign sign--${state}`}>
      <div className="sign__row">
        <span className="sign__dot" aria-hidden="true" />
        <p className="sign__message" role="status">
          {MESSAGE[state]}
        </p>
        {isListening ? (
          <button type="button" className="button button--quiet" onClick={onStop}>
            Pause listening
          </button>
        ) : (
          canStart && (
            <button type="button" className="button" onClick={onStart}>
              {state === "off" ? "Start listening" : "Try listening again"}
            </button>
          )
        )}
      </div>
      {isListening && hearing && (
        <p className="sign__hearing">
          <span className="moms-words">{hearing}</span>
        </p>
      )}
      <HelpText state={state} />
    </div>
  );
}
