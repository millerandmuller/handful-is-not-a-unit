"use client";

import { useRef, useState } from "react";
import { browserCameraEnv, checkCamera, openPickerThenCheck, shrinkPhoto } from "@/lib/photo";

interface PhotoButtonProps {
  label: string;
  /** Called with the shrunk photo. It stays on this device. */
  onPhoto: (photo: string) => void;
  /** Camera turned off or missing: tell the page, which shows one notice. The picker still works. */
  onCameraProblem: (message: string) => void;
  quiet?: boolean;
}

/**
 * The browser's own photo picker, which opens the camera on a phone or tablet.
 * Nothing about the camera is asked until this button is tapped.
 */
export function PhotoButton({ label, onPhoto, onCameraProblem, quiet }: PhotoButtonProps) {
  const input = useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState(false);

  // No `await` before the picker opens: iPhone and iPad drop it if it is opened later than the tap.
  function tapped() {
    setFailed(false);
    void openPickerThenCheck(() => input.current?.click(), () => checkCamera(browserCameraEnv()), onCameraProblem);
  }

  async function chosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset, so taking the same photo again still counts as a change.
    event.target.value = "";
    if (!file) return;
    try {
      onPhoto(await shrinkPhoto(file));
    } catch {
      setFailed(true);
    }
  }

  return (
    <>
      <button type="button" className={quiet ? "button button--quiet" : "button"} onClick={tapped}>
        {label}
      </button>
      <input ref={input} type="file" accept="image/*" capture="environment" className="visually-hidden" tabIndex={-1} aria-hidden="true" onChange={chosen} />
      {failed && (
        <span className="photo__failed" role="status">
          I couldn't use that photo. Try another one.
        </span>
      )}
    </>
  );
}
