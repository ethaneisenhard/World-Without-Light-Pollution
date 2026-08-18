import { describe, expect, it } from "vitest";
import {
  apiToolLoopTransport,
  harnessTurnKind,
  isApiToolLoopHarness,
} from "./harness-turn-kind-pure.js";

describe("harness turn kind registry", () => {
  it("maps API harnesses to api-tool-loop + transport", () => {
    expect(harnessTurnKind("anthropic")).toBe("api-tool-loop");
    expect(harnessTurnKind("studio")).toBe("api-tool-loop");
    expect(harnessTurnKind("deepseek")).toBe("api-tool-loop");
    expect(harnessTurnKind("litellm")).toBe("api-tool-loop");
    expect(apiToolLoopTransport("anthropic")).toBe("anthropic-messages");
    expect(apiToolLoopTransport("deepseek")).toBe("chat-completions");
    expect(apiToolLoopTransport("litellm")).toBe("chat-completions");
    expect(isApiToolLoopHarness("deepseek")).toBe(true);
    expect(isApiToolLoopHarness("litellm")).toBe(true);
  });

  it("maps CLI peers to cli-peer", () => {
    expect(harnessTurnKind("cursor")).toBe("cli-peer");
    expect(harnessTurnKind("hermes")).toBe("cli-peer");
    expect(apiToolLoopTransport("cursor")).toBeNull();
    expect(isApiToolLoopHarness("cursor")).toBe(false);
  });

  it("returns null for unknown ids", () => {
    expect(harnessTurnKind("nope")).toBeNull();
  });
});
