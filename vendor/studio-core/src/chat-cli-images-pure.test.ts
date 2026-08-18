import { describe, expect, it } from "vitest";
import {
  chatAttachmentRelPath,
  findLastCliUserTurn,
  formatCliHarnessUserPrompt,
} from "./chat-cli-images-pure.js";

describe("findLastCliUserTurn", () => {
  it("returns text + images from last user", () => {
    const turn = findLastCliUserTurn([
      { role: "assistant", content: "ok" },
      {
        role: "user",
        content: "look at this",
        images: [{ mediaType: "image/png", data: "abc" }],
      },
    ]);
    expect(turn?.content).toBe("look at this");
    expect(turn?.images).toHaveLength(1);
  });

  it("allows image-only user turns", () => {
    const turn = findLastCliUserTurn([
      {
        role: "user",
        content: "   ",
        images: [{ mediaType: "image/png", data: "abc" }],
      },
    ]);
    expect(turn?.content).toBe("");
    expect(turn?.images).toHaveLength(1);
  });

  it("skips preparing images", () => {
    const turn = findLastCliUserTurn([
      {
        role: "user",
        content: "hi",
        images: [
          {
            mediaType: "image/png",
            data: "",
            status: "preparing",
            localId: "x",
          },
        ],
      },
    ]);
    expect(turn?.images).toHaveLength(0);
    expect(turn?.content).toBe("hi");
  });
});

describe("formatCliHarnessUserPrompt", () => {
  it("embeds attachment paths so CLI agents can open files", () => {
    const p = formatCliHarnessUserPrompt({
      userText: "are you looking at the image i send?",
      attachmentPaths: [".scratch/chat-attachments/t1/shot.png"],
    });
    expect(p).toMatch(/\.scratch\/chat-attachments\/t1\/shot\.png/);
    expect(p).toMatch(/REQUIRED before you reply/i);
    expect(p).toMatch(/studio\.vision\.describe/);
    expect(p).toMatch(/are you looking at the image i send\?/);
  });

  it("image-only still yields a usable prompt", () => {
    const p = formatCliHarnessUserPrompt({
      userText: "",
      attachmentPaths: [".scratch/chat-attachments/t1/01.png"],
    });
    expect(p).toMatch(/01\.png/);
    expect(p).not.toBe("(empty)");
  });
});

describe("chatAttachmentRelPath", () => {
  it("keeps files under .scratch/chat-attachments", () => {
    expect(
      chatAttachmentRelPath({
        turnId: "abc",
        index: 0,
        mediaType: "image/png",
        name: "shot.png",
      }),
    ).toBe(".scratch/chat-attachments/abc/shot.png");
  });
});
