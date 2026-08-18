import { describe, expect, it } from "vitest";
import {
  GLOBAL_CHAT_RAIL_ITEM,
  MESSAGES_STUDIO_RAIL_ITEM,
  N8N_STUDIO_RAIL_ITEM,
  NOTIFICATIONS_STUDIO_RAIL_ITEM,
  STUDIO_RAIL_ITEMS,
  VOICE_STUDIO_RAIL_ITEM,
  resolveStudioRailItem,
  studioServiceStatusTitle,
} from "./studio-rail-pure.js";

describe("studio-rail-pure", () => {
  it("lists Home, Notifications, n8n, Voice, LiteLLM, and Messages in Studio section", () => {
    expect(STUDIO_RAIL_ITEMS.map((i) => i.id)).toEqual([
      "home",
      "notifications",
      "n8n",
      "voice",
      "litellm",
      "messages",
    ]);
    expect(STUDIO_RAIL_ITEMS.map((i) => i.label)).toEqual([
      "Home",
      "Notifications",
      "n8n - Workflows",
      "Voice",
      "LiteLLM",
      "Messages",
    ]);
    expect(STUDIO_RAIL_ITEMS[0]?.kind).toBe("window");
    expect(STUDIO_RAIL_ITEMS[1]?.kind).toBe("window");
    expect(STUDIO_RAIL_ITEMS[2]?.kind).toBe("service");
    expect(STUDIO_RAIL_ITEMS[3]?.kind).toBe("service");
    expect(STUDIO_RAIL_ITEMS[4]?.kind).toBe("service");
    expect(STUDIO_RAIL_ITEMS[5]?.kind).toBe("window");
  });

  it("resolves Global Chat as pinned zone item", () => {
    expect(resolveStudioRailItem("chat")).toEqual(GLOBAL_CHAT_RAIL_ITEM);
    expect(GLOBAL_CHAT_RAIL_ITEM.label).toBe("Global Chat");
  });

  it("resolves n8n service rail item with hosted URL", () => {
    expect(resolveStudioRailItem("n8n")).toEqual(N8N_STUDIO_RAIL_ITEM);
    expect(N8N_STUDIO_RAIL_ITEM.label).toBe("n8n - Workflows");
    expect(N8N_STUDIO_RAIL_ITEM.url).toContain("workflows.auth.glassboxcomputer.site");
  });

  it("resolves Voice rail Open as hosted Voice (Cloud default)", () => {
    expect(resolveStudioRailItem("voice")).toEqual(VOICE_STUDIO_RAIL_ITEM);
    expect(VOICE_STUDIO_RAIL_ITEM.label).toBe("Voice");
    expect(VOICE_STUDIO_RAIL_ITEM.url).toBe(
      "https://voice.auth.glassboxcomputer.site",
    );
  });

  it("resolves Messages window rail item", () => {
    expect(resolveStudioRailItem("messages")).toEqual(MESSAGES_STUDIO_RAIL_ITEM);
    expect(MESSAGES_STUDIO_RAIL_ITEM.window).toBe("messages");
  });

  it("resolves Notifications window rail item", () => {
    expect(resolveStudioRailItem("notifications")).toEqual(
      NOTIFICATIONS_STUDIO_RAIL_ITEM,
    );
    expect(NOTIFICATIONS_STUDIO_RAIL_ITEM.window).toBe("notifications");
  });

  it("studioServiceStatusTitle names n8n and Voice", () => {
    expect(studioServiceStatusTitle("n8n", "running")).toBe("n8n running");
    expect(studioServiceStatusTitle("n8n", "off")).toBe("n8n off");
    expect(studioServiceStatusTitle("voice", "running")).toBe("Voice running");
    expect(studioServiceStatusTitle("voice", "off")).toBe("Voice off");
  });
});
