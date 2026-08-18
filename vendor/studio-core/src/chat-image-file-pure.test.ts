import { describe, expect, it } from "vitest";
import {
  acceptChatImageFile,
  filterChatImageFiles,
} from "./chat-image-file-pure.js";

describe("acceptChatImageFile", () => {
  it("accepts normal PNG MIME", () => {
    expect(acceptChatImageFile({ type: "image/png", name: "a.png" })).toEqual({
      ok: true,
      mediaType: "image/png",
    });
  });

  it("accepts empty MIME + screenshot.png (Finder / Tauri drop)", () => {
    // Old composer filtered `type.startsWith("image/")` → silent no-op.
    expect(
      acceptChatImageFile({ type: "", name: "Screenshot 2026-08-05.png" }),
    ).toEqual({ ok: true, mediaType: "image/png" });
  });

  it("accepts application/octet-stream + .jpg", () => {
    expect(
      acceptChatImageFile({ type: "application/octet-stream", name: "shot.jpg" }),
    ).toEqual({ ok: true, mediaType: "image/jpeg" });
  });

  it("rejects TIFF with an explicit reason (not silent)", () => {
    const r = acceptChatImageFile({ type: "image/tiff", name: "shot.tiff" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toMatch(/Unsupported image type/i);
    expect(r.reason).toMatch(/PNG/i);
  });

  it("rejects HEIC with an explicit reason", () => {
    const r = acceptChatImageFile({ type: "image/heic", name: "IMG.HEIC" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toMatch(/Unsupported/i);
  });
});

describe("filterChatImageFiles", () => {
  it("returns a user error when every file is rejected (no silent console-only)", () => {
    const r = filterChatImageFiles([
      { type: "image/tiff", name: "a.tiff" },
      { type: "text/plain", name: "notes.txt" },
    ]);
    expect(r.accepted).toEqual([]);
    expect(r.error).toBeTruthy();
    expect(r.error).toMatch(/Unsupported|not a PNG/i);
  });

  it("accepts empty-type screenshots in a mixed drop", () => {
    const r = filterChatImageFiles([
      { type: "", name: "Screenshot.png" },
      { type: "text/plain", name: "readme.txt" },
    ]);
    expect(r.accepted).toHaveLength(1);
    expect(r.accepted[0]?.mediaType).toBe("image/png");
    expect(r.error).toBeNull();
  });

  it("accepts multiple PNGs in one picker/drop", () => {
    const r = filterChatImageFiles([
      { type: "image/png", name: "a.png" },
      { type: "image/png", name: "b.png" },
      { type: "image/jpeg", name: "c.jpg" },
    ]);
    expect(r.accepted).toHaveLength(3);
    expect(r.error).toBeNull();
  });
});
