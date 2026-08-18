import { describe, expect, it } from "vitest";
import {
  fleetPetStateForJob,
  fleetStatusLineFromSse,
  isFleetPetAnimState,
  projectFleetPetActivityKind,
} from "./fleet-pet-anim-pure.js";

describe("fleet-pet-anim-pure", () => {
  it("maps status to pet anim", () => {
    expect(fleetPetStateForJob({ status: "queued" })).toBe("waiting");
    expect(fleetPetStateForJob({ status: "running" })).toBe("running");
    expect(fleetPetStateForJob({ status: "blocked" })).toBe("failed");
    expect(
      fleetPetStateForJob({ status: "done", celebrating: true }),
    ).toBe("waving");
    expect(fleetPetStateForJob({ status: "cancelled" })).toBe("idle");
    expect(
      fleetPetStateForJob({ status: "running", selected: true }),
    ).toBe("review");
  });

  it("pins running desks to activity instead of one shared loop", () => {
    expect(
      fleetPetStateForJob({
        status: "running",
        statusLine: "Thinking…",
      }),
    ).toBe("review");
    expect(
      fleetPetStateForJob({
        status: "running",
        statusLine: "Run command",
      }),
    ).toBe("running");
    expect(
      fleetPetStateForJob({
        status: "running",
        statusLine: "Write file",
      }),
    ).toBe("running-right");
    expect(
      fleetPetStateForJob({
        status: "running",
        toolName: "files_read",
      }),
    ).toBe("running-left");
    expect(
      fleetPetStateForJob({
        status: "running",
        statusLine: "Search codebase",
      }),
    ).toBe("jumping");
    expect(
      fleetPetStateForJob({
        status: "running",
        statusLine: "Starting…",
      }),
    ).toBe("waiting");
  });

  it("classifies copy into activity kinds", () => {
    expect(projectFleetPetActivityKind({ statusLine: "Loading context…" })).toBe(
      "thinking",
    );
    expect(projectFleetPetActivityKind({ toolName: "shell.run" })).toBe("shell");
    expect(projectFleetPetActivityKind({ statusLine: "Queued" })).toBe("waiting");
  });

  it("projects SSE events to status lines", () => {
    expect(
      fleetStatusLineFromSse("tool-start", { name: "shell", input: {} }),
    ).toBe("Run command");
    expect(fleetStatusLineFromSse("thinking", {})).toBe("Thinking…");
    expect(
      fleetStatusLineFromSse("status", {
        phase: "prep",
        detail: "Loading context…",
      }),
    ).toBe("Loading context…");
    expect(fleetStatusLineFromSse("tool-end", { name: "shell" })).toBe(
      "Running…",
    );
    expect(fleetStatusLineFromSse("status", { phase: "done" })).toBeNull();
    expect(fleetStatusLineFromSse("delta", { text: "hi" })).toBeNull();
  });

  it("guards atlas ids", () => {
    expect(isFleetPetAnimState("running")).toBe(true);
    expect(isFleetPetAnimState("nope")).toBe(false);
  });
});
