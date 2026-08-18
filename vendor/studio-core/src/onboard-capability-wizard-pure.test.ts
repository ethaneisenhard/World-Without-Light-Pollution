import { describe, expect, it } from "vitest";
import {
  DEFAULT_ONBOARD_STACK_ID,
  onboardWizardStep,
  projectOnboardConnectWall,
  recommendedOnboardStackId,
  toggleOnboardStackSelection,
} from "./onboard-capability-wizard-pure.js";

describe("onboard-capability-wizard-pure", () => {
  it("recommends api-only", () => {
    expect(recommendedOnboardStackId({ cloudHost: true })).toBe(
      DEFAULT_ONBOARD_STACK_ID,
    );
  });

  it("toggles stack selection", () => {
    expect(toggleOnboardStackSelection(["api-only"], "coding-cursor")).toEqual([
      "api-only",
      "coding-cursor",
    ]);
    expect(toggleOnboardStackSelection(["api-only"], "api-only")).toEqual([]);
  });

  it("connect wall filters needs-connect cards", () => {
    const wall = projectOnboardConnectWall({
      states: [
        {
          id: "harness:cursor",
          kind: "harness",
          label: "Cursor",
          desired: true,
          installed: true,
          authOk: false,
          healthy: false,
          authKind: "cli-login",
        },
        {
          id: "harness:anthropic",
          kind: "harness",
          label: "Anthropic",
          desired: true,
          installed: true,
          authOk: true,
          healthy: true,
          authKind: "env",
        },
      ],
    });
    expect(wall.some((c) => c.capabilityId === "harness:cursor")).toBe(true);
  });

  it("wizard step", () => {
    expect(onboardWizardStep({ phase: "connect", connectCount: 0 })).toBe(
      "done",
    );
    expect(onboardWizardStep({ phase: "connect", connectCount: 2 })).toBe(
      "connect",
    );
  });
});
