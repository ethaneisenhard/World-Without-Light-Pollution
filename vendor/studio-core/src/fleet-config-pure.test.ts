/**
 * fleet-config-pure — vitest
 */

import { describe, expect, it } from "vitest";
import {
  parseStudioFleetConfig,
  shouldUpsertChatToFleet,
} from "./fleet-config-pure.js";

describe("fleet-config-pure", () => {
  it("parses showChats + harnessPets", () => {
    const c = parseStudioFleetConfig({
      showChats: "agentic",
      harnessPets: { Cursor: " airring ", "": "x", hermes: 1 },
    });
    expect(c.showChats).toBe("agentic");
    expect(c.harnessPets).toEqual({ cursor: "airring" });
  });

  it("gates chat upsert by showChats", () => {
    expect(
      shouldUpsertChatToFleet({ showChats: "all", agentic: false }),
    ).toBe(true);
    expect(
      shouldUpsertChatToFleet({ showChats: "agentic", agentic: false }),
    ).toBe(false);
    expect(
      shouldUpsertChatToFleet({ showChats: "agentic", agentic: true }),
    ).toBe(true);
    expect(
      shouldUpsertChatToFleet({ showChats: "spawn_durable", agentic: true }),
    ).toBe(false);
  });
});
