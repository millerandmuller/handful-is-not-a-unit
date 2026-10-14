"use client";

import { SAMPLE_SENTENCES } from "@/lib/demo/recordedAnswers";

interface DemoBannerProps {
  onSample: (sentence: string) => void;
}

/**
 * Says plainly that the app is replaying recorded answers, and offers the
 * sample sentences. A tap sends a sample down the same path as typed text.
 */
export function DemoBanner({ onSample }: DemoBannerProps) {
  return (
    <section className="demo" aria-labelledby="demo-title">
      <h2 id="demo-title" className="demo__title">
        Demo mode
      </h2>
      <p>
        These answers were recorded from Gemini ahead of time. Nothing you say or type here is sent anywhere. Try a sample sentence:
      </p>
      <ul className="demo__samples">
        {SAMPLE_SENTENCES.map((sentence) => (
          <li key={sentence}>
            <button type="button" className="button button--quiet demo__sample" onClick={() => onSample(sentence)}>
              <span className="moms-words">{sentence}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
