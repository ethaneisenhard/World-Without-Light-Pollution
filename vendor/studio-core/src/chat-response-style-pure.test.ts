import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHAT_RESPONSE_STYLE,
  parseChatResponseStyle,
  systemHintForResponseStyle,
} from "./chat-response-style-pure.js";

describe("chat-response-style-pure", () => {
  it("defaults when raw is missing", () => {
    expect(parseChatResponseStyle(undefined)).toEqual(
      DEFAULT_CHAT_RESPONSE_STYLE,
    );
    expect(parseChatResponseStyle({})).toEqual(DEFAULT_CHAT_RESPONSE_STYLE);
  });

  it("parses known values and ignores junk", () => {
    expect(
      parseChatResponseStyle({
        verbosity: "detailed",
        structure: "freeform",
      }),
    ).toEqual({ verbosity: "detailed", structure: "freeform" });
    expect(
      parseChatResponseStyle({ verbosity: "nope", structure: "structured" }),
    ).toEqual({ verbosity: "balanced", structure: "structured" });
  });

  it("systemHintForResponseStyle requires human-first spacing and limits tables when structured", () => {
    const structured = systemHintForResponseStyle({
      verbosity: "concise",
      structure: "structured",
    });
    expect(structured).toMatch(/concise/i);
    expect(structured).toMatch(/HUMAN READABILITY FIRST/i);
    expect(structured).toMatch(/BLANK LINES/i);
    expect(structured).toMatch(/NO fake tables with pipes/i);
    expect(structured).toMatch(/truly tabular/i);
    expect(structured).toMatch(/Handoff/i);
    expect(structured).toMatch(/Bullet lists/i);
    expect(structured).toMatch(/mobile/i);

    const freeform = systemHintForResponseStyle({
      verbosity: "detailed",
      structure: "freeform",
    });
    expect(freeform).toMatch(/detailed/i);
    expect(freeform).toMatch(/freeform/i);
    expect(freeform).toMatch(/blank lines/i);
  });
});

