import { describe, expect, it } from "vitest";
import {
  buildFixStudioClientBuildPrompt,
  newFixBuildSessionId,
} from "./fix-build-prompt-pure.js";

describe("fix-build-prompt-pure", () => {
  it("includes stderr and source", () => {
    const p = buildFixStudioClientBuildPrompt({
      stderr: "Unexpected token",
      source: "dev-control-plane",
      touchedPaths: ["apps/studio/client/app.tsx"],
    });
    expect(p).toContain("Unexpected token");
    expect(p).toContain("dev-control-plane");
    expect(p).toContain("apps/studio/client/app.tsx");
    expect(p).toContain("pnpm build:client");
  });

  it("session id is stable prefix", () => {
    expect(newFixBuildSessionId(1)).toMatch(/^fix-build-/);
  });
});
