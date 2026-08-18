import { describe, expect, it } from "vitest";
import {
  normalizeStudioNotification,
  sanitizeNotificationTitle,
} from "./notification-envelope-pure.js";

describe("sanitizeNotificationTitle", () => {
  it("strips [object Object] sender bake-ins", () => {
    expect(sanitizeNotificationTitle("New email from [object Object]")).toBe(
      "New email",
    );
  });

  it("leaves good titles alone", () => {
    expect(sanitizeNotificationTitle("New email from Etsy")).toBe(
      "New email from Etsy",
    );
  });
});

describe("normalizeStudioNotification", () => {
  it("heals bad titles on load", () => {
    const n = normalizeStudioNotification({
      id: "n1",
      source: "messages",
      severity: "info",
      title: "New email from [object Object]",
      createdAt: 1,
      href: { kind: "messages" },
    });
    expect(n?.title).toBe("New email");
  });
});
