import { describe, expect, it } from "vitest";
import {
  mediaTypeFromImagePath,
  parseVisionDescribeInput,
} from "./studio-vision-describe-pure.js";

describe("parseVisionDescribeInput", () => {
  it("accepts relative path", () => {
    expect(
      parseVisionDescribeInput({
        path: ".scratch/chat-attachments/t1/a.png",
        question: "What button?",
      }),
    ).toEqual({
      ok: true,
      input: {
        path: ".scratch/chat-attachments/t1/a.png",
        question: "What button?",
      },
    });
  });

  it("rejects absolute / traversal", () => {
    expect(parseVisionDescribeInput({ path: "/etc/passwd" }).ok).toBe(false);
    expect(parseVisionDescribeInput({ path: "../x.png" }).ok).toBe(false);
  });
});

describe("mediaTypeFromImagePath", () => {
  it("maps extensions", () => {
    expect(mediaTypeFromImagePath("a.JPG")).toBe("image/jpeg");
    expect(mediaTypeFromImagePath("a.webp")).toBe("image/webp");
  });
});
