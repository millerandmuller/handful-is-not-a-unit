// Photos: deciding whether the camera can be used, and shrinking a photo
// before it is saved. Photos never leave the device: nothing in here sends
// anything anywhere.

export const MAX_PHOTO_SIDE = 800;
export const PHOTO_QUALITY = 0.7;

/** The size a photo is shrunk to: its longest side is at most `maxSide`, and it is never enlarged. */
export function fitWithin(width: number, height: number, maxSide: number = MAX_PHOTO_SIDE): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export type CameraCheck = "ok" | "no-camera" | "denied";

/** What the browser can tell us about the camera, passed in so the rule can be tested. */
export interface CameraEnv {
  listDevices?: () => Promise<{ kind: string }[]>;
  cameraPermission?: () => Promise<string>;
}

/**
 * Can the camera be used? This only asks the browser what it already knows, and
 * never opens the camera or asks the person for permission.
 * - "denied" only when the browser says camera access was turned off for this page.
 * - "no-camera" only when the browser lists devices and none of them is a camera. An empty
 *   list says nothing (Safari lists nothing until permission was given), so it counts as "ok".
 * - Anything the browser cannot tell us counts as "ok": the photo picker has the last word.
 */
export async function checkCamera(env: CameraEnv): Promise<CameraCheck> {
  try {
    if (env.cameraPermission && (await env.cameraPermission()) === "denied") return "denied";
  } catch {
    // This browser does not answer the question.
  }
  try {
    if (env.listDevices) {
      const devices = await env.listDevices();
      if (devices.length > 0 && !devices.some((device) => device.kind === "videoinput")) return "no-camera";
    }
  } catch {
    // This browser does not answer the question.
  }
  return "ok";
}

export const CAMERA_MESSAGE: Record<Exclude<CameraCheck, "ok">, string> = {
  denied: "The camera looks turned off for this page. You can turn it on in the browser's settings. Photos from the photo library still work, and everything else works as usual.",
  "no-camera": "This device does not seem to have a camera the page can use. Photos from the photo library still work, and everything else works as usual.",
};

/**
 * What happens when a photo button is tapped. The picker has to open right inside the tap:
 * on iPhone and iPad (WebKit) a file picker opened after an `await` is silently dropped. So the
 * picker opens first, and only then is the camera asked about, just to show a notice.
 * Whatever the check finds, the picker has the last word on whether a photo is taken.
 */
export function openPickerThenCheck(openPicker: () => void, check: () => Promise<CameraCheck>, onProblem: (message: string) => void): Promise<void> {
  openPicker();
  return check()
    .then((camera) => {
      if (camera !== "ok") onProblem(CAMERA_MESSAGE[camera]);
    })
    .catch(() => {
      // Not knowing about the camera is not a problem: the picker already opened.
    });
}

/** The browser's own answers, asked only when the function is called (never at page load). */
export function browserCameraEnv(): CameraEnv {
  return {
    listDevices: navigator.mediaDevices?.enumerateDevices ? () => navigator.mediaDevices.enumerateDevices() : undefined,
    cameraPermission: navigator.permissions?.query
      ? async () => (await navigator.permissions.query({ name: "camera" as PermissionName })).state
      : undefined,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Shrinks a chosen image to a small JPEG and returns it as a data address that can be saved with the recipe. */
export async function shrinkPhoto(file: Blob, maxSide: number = MAX_PHOTO_SIDE): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That is not a picture.");
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not shrink the photo.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", PHOTO_QUALITY));
  if (!blob) throw new Error("Could not shrink the photo.");
  return blobToDataUrl(blob);
}
