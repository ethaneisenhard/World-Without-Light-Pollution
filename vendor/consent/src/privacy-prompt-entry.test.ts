/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createConsentApi } from "./consent-api.js";
import { mountPrivacyPrompt } from "./privacy-prompt-entry.js";

const banner = {
  title: "We value your privacy",
  description: "We use cookies.",
  acceptAllLabel: "Accept all",
  rejectNonEssentialLabel: "Reject non-essential",
  customizeLabel: "Customize",
  privacyPolicyUrl: "/privacy",
};

describe("mountPrivacyPrompt", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.head.querySelector("#as-consent-styles")?.remove();
  });

  it("paints floating overlay panel with styled actions", () => {
    const store = new Map<string, string>();
    const consent = createConsentApi({
      siteId: "starter",
      policyVersion: "1",
      storage: {
        getItem: (k) => (store.has(k) ? store.get(k)! : null),
        setItem: (k, v) => {
          store.set(k, v);
        },
      },
    });

    const { dispose } = mountPrivacyPrompt({ consent, banner });

    const root = document.getElementById("as-consent-root");
    expect(root).toBeTruthy();
    expect(getComputedStyle(root!).position).toBe("fixed");
    expect(document.getElementById("as-consent-styles")).toBeTruthy();

    const panel = root!.querySelector(".as-consent-panel");
    expect(panel).toBeTruthy();
    expect(panel!.getAttribute("role")).toBe("dialog");

    const buttons = Array.from(root!.querySelectorAll(".as-consent-actions button"));
    expect(buttons.map((b) => b.textContent)).toEqual([
      "Accept all",
      "Reject non-essential",
      "Customize",
    ]);
    expect(buttons[0]!.classList.contains("primary")).toBe(true);
    expect(root!.querySelector("a.as-consent-privacy")?.getAttribute("href")).toBe("/privacy");

    dispose();
    expect(document.getElementById("as-consent-root")).toBeNull();
  });

  it("accept all hides panel and stores consent", () => {
    const store = new Map<string, string>();
    const consent = createConsentApi({
      siteId: "starter",
      policyVersion: "1",
      storage: {
        getItem: (k) => (store.has(k) ? store.get(k)! : null),
        setItem: (k, v) => {
          store.set(k, v);
        },
      },
    });

    mountPrivacyPrompt({ consent, banner });
    const accept = document.querySelector(
      ".as-consent-actions .primary",
    ) as HTMLButtonElement | null;
    expect(accept).toBeTruthy();
    accept!.click();
    expect(document.getElementById("as-consent-root")).toBeNull();
    expect(consent.has("analytics")).toBe(true);
    expect(consent.hasStoredConsent()).toBe(true);
  });

  it("customize shows category toggles then save", () => {
    const store = new Map<string, string>();
    const consent = createConsentApi({
      siteId: "starter",
      policyVersion: "1",
      storage: {
        getItem: (k) => (store.has(k) ? store.get(k)! : null),
        setItem: (k, v) => {
          store.set(k, v);
        },
      },
    });

    mountPrivacyPrompt({
      consent,
      banner,
      categories: {
        analytics: { label: "Analytics", description: "Usage." },
      },
      preferences: {
        linkLabel: "Cookie preferences",
        title: "Your privacy choices",
        saveLabel: "Save preferences",
        closeLabel: "Close",
      },
    });

    const customize = Array.from(
      document.querySelectorAll(".as-consent-actions button"),
    ).find((b) => b.textContent === "Customize") as HTMLButtonElement;
    customize.click();

    expect(document.querySelector(".as-consent-categories")).toBeTruthy();
    const analyticsToggle = document.querySelector(
      'input[data-category="analytics"]',
    ) as HTMLInputElement;
    analyticsToggle.checked = true;
    analyticsToggle.dispatchEvent(new Event("change", { bubbles: true }));

    const save = document.querySelector(
      ".as-consent-actions .primary",
    ) as HTMLButtonElement;
    save.click();
    expect(consent.has("analytics")).toBe(true);
    expect(document.getElementById("as-consent-root")).toBeNull();
  });
});
