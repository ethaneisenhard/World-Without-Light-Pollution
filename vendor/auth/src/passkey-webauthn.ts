/**
 * Passkey registration / authentication via @simplewebauthn/server (Kent shape).
 * Challenge storage is injected — hosts keep challenges in session/KV.
 */
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type { PasskeyRecord, PasskeyStore } from "./passkey-types.js";
import type { AuthUser } from "./types.js";
import type { WebAuthnConfig } from "./webauthn-config-pure.js";

export type ChallengeStore = {
  set: (key: string, challenge: string) => void | Promise<void>;
  get: (key: string) => string | null | Promise<string | null>;
  clear: (key: string) => void | Promise<void>;
};

function challengeKey(kind: "reg" | "auth", userId: string) {
  return `webauthn:${kind}:${userId}`;
}

export async function createPasskeyRegistrationOptions(input: {
  config: WebAuthnConfig;
  user: AuthUser;
  passkeyStore: PasskeyStore;
  challengeStore: ChallengeStore;
}) {
  const existing = await input.passkeyStore.listByUserId(input.user.id);
  const options = await generateRegistrationOptions({
    rpName: input.config.rpName,
    rpID: input.config.rpID,
    userName: input.user.email,
    userID: new TextEncoder().encode(input.user.id),
    userDisplayName: input.user.name ?? input.user.email,
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({
      id: p.id,
      transports: parseTransports(p.transports),
    })),
    authenticatorSelection: {
      // Kent: required for discoverable credentials / conditional UI autofill.
      residentKey: "required",
      userVerification: "preferred",
    },
  });
  await input.challengeStore.set(challengeKey("reg", input.user.id), options.challenge);
  return options;
}

export async function verifyPasskeyRegistration(input: {
  config: WebAuthnConfig;
  user: AuthUser;
  response: RegistrationResponseJSON;
  passkeyStore: PasskeyStore;
  challengeStore: ChallengeStore;
}): Promise<{ ok: true; passkey: PasskeyRecord } | { ok: false; error: string }> {
  const expectedChallenge = await input.challengeStore.get(
    challengeKey("reg", input.user.id),
  );
  if (!expectedChallenge) return { ok: false, error: "missing_challenge" };

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response: input.response,
      expectedChallenge,
      expectedOrigin: input.config.origin,
      expectedRPID: input.config.rpID,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "verify_failed" };
  }

  await input.challengeStore.clear(challengeKey("reg", input.user.id));
  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false, error: "not_verified" };
  }

  const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
    verification.registrationInfo;

  const passkey: PasskeyRecord = {
    id: credential.id,
    aaguid: aaguid ?? "00000000-0000-0000-0000-000000000000",
    publicKey: credential.publicKey,
    userId: input.user.id,
    webauthnUserId: input.user.id,
    counter: credential.counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: credential.transports?.join(",") ?? null,
  };
  await input.passkeyStore.upsert(passkey);
  return { ok: true, passkey };
}

export async function createPasskeyAuthenticationOptions(input: {
  config: WebAuthnConfig;
  /** When set, limit allowCredentials to this user's keys (authenticated manage flow). */
  userId?: string;
  passkeyStore: PasskeyStore;
  challengeStore: ChallengeStore;
  /** Stable key for challenge when anonymous (e.g. session id). */
  challengeSubject: string;
}) {
  let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined;
  if (input.userId) {
    const existing = await input.passkeyStore.listByUserId(input.userId);
    allowCredentials = existing.map((p) => ({
      id: p.id,
      transports: parseTransports(p.transports),
    }));
  }

  const options = await generateAuthenticationOptions({
    rpID: input.config.rpID,
    userVerification: "preferred",
    allowCredentials,
  });
  await input.challengeStore.set(
    challengeKey("auth", input.challengeSubject),
    options.challenge,
  );
  return options;
}

export async function verifyPasskeyAuthentication(input: {
  config: WebAuthnConfig;
  response: AuthenticationResponseJSON;
  passkeyStore: PasskeyStore;
  challengeStore: ChallengeStore;
  challengeSubject: string;
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const expectedChallenge = await input.challengeStore.get(
    challengeKey("auth", input.challengeSubject),
  );
  if (!expectedChallenge) return { ok: false, error: "missing_challenge" };

  const passkey = await input.passkeyStore.getById(input.response.id);
  if (!passkey) return { ok: false, error: "unknown_credential" };

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response: input.response,
      expectedChallenge,
      expectedOrigin: input.config.origin,
      expectedRPID: input.config.rpID,
      credential: {
        id: passkey.id,
        publicKey: passkey.publicKey,
        counter: passkey.counter,
        transports: parseTransports(passkey.transports),
      },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "verify_failed" };
  }

  await input.challengeStore.clear(challengeKey("auth", input.challengeSubject));
  if (!verification.verified) return { ok: false, error: "not_verified" };

  await input.passkeyStore.updateCounter(
    passkey.id,
    verification.authenticationInfo.newCounter,
  );
  return { ok: true, userId: passkey.userId };
}

function parseTransports(
  raw: string | null | undefined,
): AuthenticatorTransportFuture[] | undefined {
  if (!raw) return undefined;
  return raw.split(",").filter(Boolean) as AuthenticatorTransportFuture[];
}

export function createMemoryChallengeStore(): ChallengeStore {
  const map = new Map<string, string>();
  return {
    set(key, challenge) {
      map.set(key, challenge);
    },
    get(key) {
      return map.get(key) ?? null;
    },
    clear(key) {
      map.delete(key);
    },
  };
}
