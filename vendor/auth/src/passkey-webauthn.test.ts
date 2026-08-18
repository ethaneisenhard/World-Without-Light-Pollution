import { describe, expect, it } from "vitest";
import { createMemoryPasskeyStore } from "./memory-passkey-store.js";
import {
  createMemoryChallengeStore,
  createPasskeyAuthenticationOptions,
  createPasskeyRegistrationOptions,
} from "./passkey-webauthn.js";
import { getWebAuthnConfig } from "./webauthn-config-pure.js";

describe("passkey-webauthn options", () => {
  it("creates registration options with challenge stored", async () => {
    const config = getWebAuthnConfig({ url: "http://127.0.0.1:4400/login" });
    const challengeStore = createMemoryChallengeStore();
    const passkeyStore = createMemoryPasskeyStore();
    const options = await createPasskeyRegistrationOptions({
      config,
      user: { id: "u1", email: "a@example.com", role: "MEMBER" },
      passkeyStore,
      challengeStore,
    });
    expect(options.challenge.length).toBeGreaterThan(10);
    expect(options.rp.id).toBe("127.0.0.1");
    expect(await challengeStore.get("webauthn:reg:u1")).toBe(options.challenge);
  });

  it("creates authentication options for challenge subject", async () => {
    const config = getWebAuthnConfig({ url: "http://127.0.0.1:4400/login" });
    const challengeStore = createMemoryChallengeStore();
    const options = await createPasskeyAuthenticationOptions({
      config,
      passkeyStore: createMemoryPasskeyStore(),
      challengeStore,
      challengeSubject: "anon-session",
    });
    expect(options.challenge.length).toBeGreaterThan(10);
    expect(await challengeStore.get("webauthn:auth:anon-session")).toBe(
      options.challenge,
    );
  });
});
