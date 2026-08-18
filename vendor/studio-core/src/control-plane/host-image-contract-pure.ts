/**
 * Hosted ≡ Self-host Host image contract (ADR 0014).
 * One artifact; operator differs. Control plane reads FLY_HOST_IMAGE.
 */

/** Canonical Fly app that publishes the SKU Host image. */
export const STUDIO_HOST_IMAGE_FLY_APP = "glassbox-studio-host" as const;

/** Dockerfile / deploy entry relative to monorepo root. */
export const STUDIO_HOST_IMAGE_DOCKERFILE =
  "infra/studio-host-fly/Dockerfile" as const;

export const STUDIO_HOST_IMAGE_FLY_TOML =
  "infra/studio-host-fly/fly.toml" as const;

/** Env key on control plane Worker for provision / redeploy. */
export const STUDIO_HOST_IMAGE_ENV_KEY = "FLY_HOST_IMAGE" as const;

/**
 * Default registry ref when env unset (local docs / dry-run).
 * Production must set FLY_HOST_IMAGE to a pinned tag or digest.
 */
export function defaultStudioHostImageRef(tag = "latest"): string {
  const t = tag.trim() || "latest";
  return `registry.fly.io/${STUDIO_HOST_IMAGE_FLY_APP}:${t}`;
}

export function resolveStudioHostImageRef(input: {
  envImage?: string | null;
  /** Fallback tag when env empty — prefer pinning in prod. */
  fallbackTag?: string;
}): { image: string; fromEnv: boolean } {
  const fromEnv = input.envImage?.trim() ?? "";
  if (fromEnv) return { image: fromEnv, fromEnv: true };
  return {
    image: defaultStudioHostImageRef(input.fallbackTag),
    fromEnv: false,
  };
}

/** True when ref looks like a digest pin (`@sha256:…`) or non-latest tag. */
export function isPinnedHostImageRef(image: string): boolean {
  const s = image.trim();
  if (!s) return false;
  if (s.includes("@sha256:")) return true;
  const tag = s.split(":").pop() ?? "";
  return Boolean(tag) && tag !== "latest" && !tag.includes("/");
}
