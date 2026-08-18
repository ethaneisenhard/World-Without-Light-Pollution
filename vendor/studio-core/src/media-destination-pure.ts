/**
 * Resolve project media destination from project.json + destination JSON.
 * Pure — secret refs stay as strings; Node resolves env at store creation.
 */

export type MediaDestinationKind = "media-local" | "local" | "r2" | "media-r2";

export type MediaDestinationResolved =
  | {
      kind: "local";
      /** Relative to project root, default `media` */
      path: string;
    }
  | {
      kind: "r2";
      bucket: string;
      publicBaseUrl?: string;
      /** Object key prefix (project id recommended) */
      prefix: string;
      credentials: {
        accountId: string;
        accessKeyId: string;
        secretAccessKey: string;
      };
    };

export type MediaDestinationRaw = {
  id?: string;
  kind?: string;
  path?: string;
  bucket?: string;
  publicBaseUrl?: string;
  prefix?: string;
  credentials?: {
    accountId?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
};

/** `secret:FOO` → look up env FOO later; plain string passes through. */
export function unwrapSecretRef(value: string): {
  kind: "literal" | "secret";
  name: string;
} {
  const v = value.trim();
  if (v.startsWith("secret:")) {
    return { kind: "secret", name: v.slice("secret:".length).trim() };
  }
  return { kind: "literal", name: v };
}

export function isR2MediaKind(kind: string | undefined): boolean {
  const k = (kind ?? "").trim().toLowerCase();
  return k === "r2" || k === "media-r2";
}

export function isLocalMediaKind(kind: string | undefined): boolean {
  const k = (kind ?? "").trim().toLowerCase();
  return !k || k === "local" || k === "media-local";
}

/**
 * Parse destination JSON into a resolved shape.
 * Credential fields may still be `secret:ENV` refs.
 */
export function parseMediaDestination(
  raw: MediaDestinationRaw | null | undefined,
  opts?: { defaultPrefix?: string },
): MediaDestinationResolved | null {
  if (!raw || typeof raw !== "object") return null;
  const kind = raw.kind?.trim();
  if (isLocalMediaKind(kind)) {
    return {
      kind: "local",
      path: (raw.path?.trim() || "media").replace(/^\/+/, ""),
    };
  }
  if (!isR2MediaKind(kind)) return null;
  const bucket = raw.bucket?.trim();
  const accountId = raw.credentials?.accountId?.trim();
  const accessKeyId = raw.credentials?.accessKeyId?.trim();
  const secretAccessKey = raw.credentials?.secretAccessKey?.trim();
  if (!bucket || !accountId || !accessKeyId || !secretAccessKey) return null;
  return {
    kind: "r2",
    bucket,
    publicBaseUrl: raw.publicBaseUrl?.trim() || undefined,
    prefix: (raw.prefix?.trim() || opts?.defaultPrefix || "media").replace(
      /^\/+|\/+$/g,
      "",
    ),
    credentials: { accountId, accessKeyId, secretAccessKey },
  };
}

export function storageMediaDestinationId(
  projectConfig: { storage?: { media?: string } } | null | undefined,
): string | null {
  const id = projectConfig?.storage?.media?.trim();
  return id || null;
}
