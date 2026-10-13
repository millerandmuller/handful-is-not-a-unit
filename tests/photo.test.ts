import { describe, expect, it } from "vitest";
import { CAMERA_MESSAGE, checkCamera, fitWithin, MAX_PHOTO_SIDE, openPickerThenCheck } from "../lib/photo";

describe("shrinking", () => {
  it("brings the longest side down to the limit and keeps the shape", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: MAX_PHOTO_SIDE, height: 600 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 600, height: MAX_PHOTO_SIDE });
  });

  it("never enlarges a small photo", () => {
    expect(fitWithin(320, 240)).toEqual({ width: 320, height: 240 });
  });

  it("never makes a side smaller than one pixel", () => {
    expect(fitWithin(10000, 3).height).toBe(1);
  });
});

describe("can the camera be used", () => {
  it("is fine when the browser says nothing at all, because the photo picker has the last word", async () => {
    expect(await checkCamera({})).toBe("ok");
  });

  it("says denied only when the browser reports camera access is turned off", async () => {
    expect(await checkCamera({ cameraPermission: async () => "denied" })).toBe("denied");
    expect(await checkCamera({ cameraPermission: async () => "prompt" })).toBe("ok");
    expect(await checkCamera({ cameraPermission: async () => "granted" })).toBe("ok");
  });

  it("says no camera only when devices are listed and none is a camera", async () => {
    expect(await checkCamera({ listDevices: async () => [{ kind: "audioinput" }, { kind: "audiooutput" }] })).toBe("no-camera");
    expect(await checkCamera({ listDevices: async () => [{ kind: "audioinput" }, { kind: "videoinput" }] })).toBe("ok");
  });

  it("treats an empty device list as unknown, because Safari lists nothing before permission", async () => {
    expect(await checkCamera({ listDevices: async () => [] })).toBe("ok");
  });

  it("treats a browser that fails to answer as unknown", async () => {
    const fails = async () => {
      throw new Error("not allowed");
    };
    expect(await checkCamera({ cameraPermission: fails, listDevices: fails })).toBe("ok");
  });
});

describe("tapping a photo button", () => {
  it("opens the picker inside the tap itself, before anything has been awaited", () => {
    const calls: string[] = [];
    // Called without await: if the picker only opened after the check, `calls` would still be empty here.
    void openPickerThenCheck(
      () => calls.push("picker"),
      async () => {
        calls.push("check");
        return "ok";
      },
      () => calls.push("notice"),
    );
    expect(calls[0]).toBe("picker");
  });

  it("shows the notice afterwards when the camera looks turned off, and the picker was still opened", async () => {
    const calls: string[] = [];
    await openPickerThenCheck(() => calls.push("picker"), async () => "denied", (message) => calls.push(message));
    expect(calls).toEqual(["picker", CAMERA_MESSAGE.denied]);
  });

  it("shows no notice when the camera is fine, and does not fail when the browser cannot say", async () => {
    const calls: string[] = [];
    await openPickerThenCheck(() => calls.push("picker"), async () => "ok", () => calls.push("notice"));
    await openPickerThenCheck(() => calls.push("picker"), async () => { throw new Error("no"); }, () => calls.push("notice"));
    expect(calls).toEqual(["picker", "picker"]);
  });
});
