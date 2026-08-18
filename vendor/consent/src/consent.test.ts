import { createActor } from "xstate";
import { describe, expect, it } from "vitest";
import { createConsentApi, resolveConsentStorage } from "./consent-api.js";
import { privacyPromptMachine } from "./privacy-prompt-machine.js";

describe("createConsentApi", () => {
  it("round-trips localStorage-like storage", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    const api = createConsentApi({
      siteId: "starter",
      policyVersion: "1",
      storage,
      regionDefaults: "opt-in",
    });
    expect(api.has("analytics")).toBe(false);
    expect(api.hasStoredConsent()).toBe(false);
    api.acceptAll();
    expect(api.has("analytics")).toBe(true);
    expect(api.hasStoredConsent()).toBe(true);

    const api2 = createConsentApi({
      siteId: "starter",
      policyVersion: "1",
      storage,
    });
    expect(api2.hasStoredConsent()).toBe(true);
    expect(api2.has("analytics")).toBe(true);
  });

  it("resolveConsentStorage prefers localStorage when present", () => {
    const store = new Map<string, string>();
    const fakeLs = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    const prev = (globalThis as { localStorage?: unknown }).localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: fakeLs,
    });
    try {
      expect(resolveConsentStorage()).toBe(fakeLs);
      const a = createConsentApi({ siteId: "live", policyVersion: "1" });
      a.acceptAll();
      const b = createConsentApi({ siteId: "live", policyVersion: "1" });
      expect(b.hasStoredConsent()).toBe(true);
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: prev,
      });
    }
  });

  it("rejectNonEssential clears optional categories", () => {
    const store = new Map<string, string>();
    const api = createConsentApi({
      siteId: "s",
      policyVersion: "1",
      storage: {
        getItem: (k) => (store.has(k) ? store.get(k)! : null),
        setItem: (k, v) => {
          store.set(k, v);
        },
      },
    });
    api.acceptAll();
    api.rejectNonEssential();
    expect(api.has("analytics")).toBe(false);
    expect(api.has("strictly_necessary")).toBe(true);
  });
});

describe("privacyPromptMachine", () => {
  it("shows banner on boot without stored consent", () => {
    const actor = createActor(privacyPromptMachine);
    actor.start();
    actor.send({ type: "BOOT", hasStoredConsent: false });
    expect(actor.getSnapshot().matches("banner")).toBe(true);
    actor.send({ type: "ACCEPT_ALL" });
    expect(actor.getSnapshot().matches("hidden")).toBe(true);
    expect(actor.getSnapshot().context.hasStoredConsent).toBe(true);
    actor.stop();
  });

  it("stays hidden when consent already stored", () => {
    const actor = createActor(privacyPromptMachine);
    actor.start();
    actor.send({ type: "BOOT", hasStoredConsent: true });
    expect(actor.getSnapshot().matches("hidden")).toBe(true);
    actor.stop();
  });

  it("customize → save marks stored", () => {
    const actor = createActor(privacyPromptMachine);
    actor.start();
    actor.send({ type: "BOOT", hasStoredConsent: false });
    actor.send({ type: "OPEN_CUSTOMIZE" });
    expect(actor.getSnapshot().matches("customize")).toBe(true);
    actor.send({ type: "SAVE" });
    expect(actor.getSnapshot().matches("hidden")).toBe(true);
    actor.stop();
  });
});
