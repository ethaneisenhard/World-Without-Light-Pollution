/**
 * Host platform release pin — BrowserUI ADR-0040-inspired (image digest as blob).
 */

export type PlatformChannel = "stable" | "beta";

export type PlatformReleaseManifest = {
  platformVersion: string;
  channel: PlatformChannel;
  /** registry.fly.io/… digest or tag */
  hostImage: string;
  releaseNotes?: string;
  publishedAt?: number;
};

export type HostUpdateProjection = {
  currentImage: string | null;
  latest: PlatformReleaseManifest | null;
  updateAvailable: boolean;
  note: string;
};

export function normalizeHostImageRef(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw.trim() : "";
}

/** Compare image refs loosely (tag or digest string equality). */
export function hostImagesEqual(a: string | null, b: string | null): boolean {
  const x = normalizeHostImageRef(a);
  const y = normalizeHostImageRef(b);
  if (!x || !y) return false;
  return x === y;
}

export function projectHostUpdate(input: {
  currentImage?: string | null;
  /** Newest published for the tenant’s channel. */
  latest?: PlatformReleaseManifest | null;
}): HostUpdateProjection {
  const current = normalizeHostImageRef(input.currentImage) || null;
  const latest = input.latest ?? null;
  if (!latest?.hostImage) {
    return {
      currentImage: current,
      latest: null,
      updateAvailable: false,
      note: "No published Host platform version yet.",
    };
  }
  const updateAvailable = !hostImagesEqual(current, latest.hostImage);
  return {
    currentImage: current,
    latest,
    updateAvailable,
    note: updateAvailable
      ? `Host update available: ${latest.platformVersion} (${latest.channel}). Install rolls the machine image; /data volume is kept.`
      : `Host is on ${latest.platformVersion} (${latest.channel}).`,
  };
}

/** Build a single-channel catalog from control-plane env (v0 — no R2 yet). */
export function platformReleasesFromEnv(input: {
  flyHostImage?: string | null;
  platformVersion?: string | null;
  channel?: string | null;
}): PlatformReleaseManifest[] {
  const hostImage = normalizeHostImageRef(input.flyHostImage);
  if (!hostImage) return [];
  const channel: PlatformChannel =
    input.channel === "beta" ? "beta" : "stable";
  const platformVersion =
    input.platformVersion?.trim() ||
    hostImage.split(":").pop() ||
    "current";
  return [
    {
      platformVersion,
      channel,
      hostImage,
      releaseNotes: "Control-plane FLY_HOST_IMAGE pin (v0 registry).",
    },
  ];
}
