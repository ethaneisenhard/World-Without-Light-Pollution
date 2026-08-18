export type WebAuthnConfig = {
  rpName: string;
  rpID: string;
  origin: string;
};

/**
 * Kent-shaped RP config from request URL.
 * residentKey / userVerification left to option generators.
 */
export function getWebAuthnConfig(
  request: { url: string },
  opts?: { rpName?: string },
): WebAuthnConfig {
  const url = new URL(request.url);
  return {
    rpName: opts?.rpName ?? "Glass Box Studio",
    rpID: url.hostname,
    origin: url.origin,
  };
}
