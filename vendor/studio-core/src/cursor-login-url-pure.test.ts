import { describe, expect, it } from "vitest";
import {
  isCursorLoginUrl,
  parseCursorLoginUrlFromOutput,
} from "./cursor-login-url-pure.js";

describe("parseCursorLoginUrlFromOutput", () => {
  it("extracts loginDeepControl URL from CLI prose", () => {
    const url =
      "https://cursor.com/loginDeepControl?challenge=abc&uuid=def&mode=login&redirectTarget=cli";
    expect(
      parseCursorLoginUrlFromOutput(
        `Starting login process...\nOpen a browser and navigate to this link: ${url}\n`,
      ),
    ).toBe(url);
  });

  it("returns null when missing", () => {
    expect(parseCursorLoginUrlFromOutput("Waiting…")).toBeNull();
  });

  it("strips trailing punctuation", () => {
    const url =
      "https://cursor.com/loginDeepControl?challenge=x&uuid=y&mode=login&redirectTarget=cli";
    expect(parseCursorLoginUrlFromOutput(`link: ${url}.`)).toBe(url);
  });
});

describe("isCursorLoginUrl", () => {
  it("accepts cursor.com loginDeepControl https", () => {
    expect(
      isCursorLoginUrl(
        "https://cursor.com/loginDeepControl?challenge=a&uuid=b&mode=login&redirectTarget=cli",
      ),
    ).toBe(true);
  });

  it("rejects other hosts", () => {
    expect(isCursorLoginUrl("https://evil.example/loginDeepControl")).toBe(
      false,
    );
  });
});
