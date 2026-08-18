/**
 * WebAuthn RP ID host rules (SimpleWebAuthn / browser SecurityError).
 * `localhost` is allowed; bare IPs like `127.0.0.1` are not.
 */

/** Same shape SimpleWebAuthn uses for domain checks (plus localhost). */
export function isWebAuthnRpIdHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host) return false;
  if (host === "localhost") return true;
  return /^((xn--[a-z0-9-]+|[a-z0-9]+(-[a-z0-9]+)*)\.)+([a-z]{2,}|xn--[a-z0-9-]+)$/i.test(
    host,
  );
}

/** User-facing hint when passkeys cannot run on this host. */
export function passkeyUnsupportedHostMessage(hostname: string): string {
  const host = hostname.trim().toLowerCase();
  if (host === "127.0.0.1" || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return "Passkeys need http://localhost (not 127.0.0.1) or a real HTTPS domain.";
  }
  return "Passkeys are not available on this host.";
}

/** Map library / browser errors to copy; null = silent (e.g. autofill on bad host). */
export function formatPasskeyClientError(
  input: {
    message: string;
    hostname: string;
    /** Conditional UI / autofill — prefer silence on host problems. */
    autofill?: boolean;
  },
): string | null {
  const msg = input.message.trim();
  const hostBad = !isWebAuthnRpIdHostname(input.hostname);
  const looksInvalidDomain =
    /invalid domain/i.test(msg) || /ERROR_INVALID_DOMAIN/i.test(msg);

  if (hostBad || looksInvalidDomain) {
    if (input.autofill) return null;
    return passkeyUnsupportedHostMessage(input.hostname);
  }
  return msg || null;
}
