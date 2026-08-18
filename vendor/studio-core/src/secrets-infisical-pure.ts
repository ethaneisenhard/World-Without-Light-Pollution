/**
 * Infisical secrets SoT — pure validation, path defaults, redaction.
 * No fetch / fs / env reads.
 */

export const INFISICAL_ENV_SLUGS = ["dev", "staging", "prod"] as const;
export type InfisicalEnvSlug = (typeof INFISICAL_ENV_SLUGS)[number];

export const INFISICAL_SECRET_PATHS = [
  "/studio",
  "/cloudflare",
  "/n8n",
  "/aws",
  "/browserui",
  "/host",
  "/fly",
] as const;
export type InfisicalSecretPath = (typeof INFISICAL_SECRET_PATHS)[number];

/** Cloudflare Worker bindings we auto-push after secrets.set */
export const WORKER_SECRET_BINDINGS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SESSION_SECRET",
  "ANTHROPIC_API_KEY",
] as const;

export type WorkerSecretBinding = (typeof WORKER_SECRET_BINDINGS)[number];

const SECRET_KEY_RE = /^[A-Z][A-Z0-9_]*$/;

export function isValidSecretKey(key: string): boolean {
  return SECRET_KEY_RE.test(key) && key.length <= 128;
}

export function parseInfisicalEnvSlug(raw: unknown): InfisicalEnvSlug | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  return (INFISICAL_ENV_SLUGS as readonly string[]).includes(s)
    ? (s as InfisicalEnvSlug)
    : null;
}

export function parseInfisicalSecretPath(raw: unknown): InfisicalSecretPath | null {
  if (typeof raw !== "string") return null;
  let p = raw.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/+$/, "") || "/";
  return (INFISICAL_SECRET_PATHS as readonly string[]).includes(p)
    ? (p as InfisicalSecretPath)
    : null;
}

/** Folder from key prefix when caller omits path. */
export function defaultSecretPathForKey(key: string): InfisicalSecretPath {
  if (key.startsWith("CLOUDFLARE_") || key.startsWith("R2_")) return "/cloudflare";
  if (key.startsWith("N8N_")) return "/n8n";
  if (key.startsWith("AWS_")) return "/aws";
  if (key.startsWith("FLY_")) return "/fly";
  if (
    key.startsWith("BROWSERUI_") ||
    key.startsWith("ZULIP_") ||
    key === "DATABASE_URL"
  ) {
    return "/browserui";
  }
  if (
    key.startsWith("STUDIO_PREVIEW_") ||
    key.startsWith("STUDIO_DESK_") ||
    key.startsWith("STUDIO_ACME_") ||
    key.startsWith("STUDIO_HOST_") ||
    key === "STUDIO_STACKS" ||
    key === "STUDIO_SERVE_HOST" ||
    key === "AGENT_STUDIO_HOME" ||
    key === "APP_ORIGIN"
  ) {
    return "/host";
  }
  return "/studio";
}

export function resolveSecretPath(
  key: string,
  pathRaw?: unknown,
): InfisicalSecretPath | { error: string } {
  if (pathRaw !== undefined && pathRaw !== null && String(pathRaw).trim()) {
    const parsed = parseInfisicalSecretPath(pathRaw);
    if (!parsed) {
      return {
        error: `path must be one of ${INFISICAL_SECRET_PATHS.join(", ")}`,
      };
    }
    return parsed;
  }
  return defaultSecretPathForKey(key);
}

export function resolveSecretEnv(
  envRaw?: unknown,
  fallback: InfisicalEnvSlug = "dev",
): InfisicalEnvSlug | { error: string } {
  if (envRaw === undefined || envRaw === null || String(envRaw).trim() === "") {
    return fallback;
  }
  const parsed = parseInfisicalEnvSlug(envRaw);
  if (!parsed) {
    return { error: `env must be one of ${INFISICAL_ENV_SLUGS.join(", ")}` };
  }
  return parsed;
}

/** Map Infisical / Studio key → Worker binding name when auto-pushable. */
export function workerBindingForSecretKey(key: string): WorkerSecretBinding | null {
  if ((WORKER_SECRET_BINDINGS as readonly string[]).includes(key)) {
    return key as WorkerSecretBinding;
  }
  if (key === "GOOGLE_OAUTH_CLIENT_ID") return "GOOGLE_CLIENT_ID";
  if (key === "GOOGLE_OAUTH_CLIENT_SECRET") return "GOOGLE_CLIENT_SECRET";
  return null;
}

export function redactSecretValue(value: string): string {
  const v = value.trim();
  if (!v) return "(empty)";
  if (v.length <= 4) return "****";
  return `${v.slice(0, 2)}…${v.slice(-2)} (${v.length} chars)`;
}

export function unquoteDotenvValue(value: string): string {
  const v = value.trim();
  if (
    v.length >= 2 &&
    ((v.startsWith("'") && v.endsWith("'")) ||
      (v.startsWith('"') && v.endsWith('"')))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

export type SecretListItem = {
  key: string;
  path: string;
  environment: string;
  /** Always redacted for list responses. */
  valuePreview: string;
};

export function toRedactedListItem(input: {
  key: string;
  path: string;
  environment: string;
  value?: string;
}): SecretListItem {
  return {
    key: input.key,
    path: input.path,
    environment: input.environment,
    valuePreview: input.value
      ? redactSecretValue(input.value)
      : "(hidden)",
  };
}

/** Merge KEY=value into dotenv text; last wins; strip quotes on write. */
export function mergeDotenvKey(
  existing: string,
  key: string,
  value: string,
): string {
  const lines = existing.split(/\n/);
  const out: string[] = [];
  let seen = false;
  const clean = unquoteDotenvValue(value);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      out.push(line);
      continue;
    }
    const eq = trimmed.indexOf("=");
    const k = trimmed.slice(0, eq).trim();
    if (k === key) {
      out.push(`${key}=${clean}`);
      seen = true;
    } else {
      out.push(line);
    }
  }
  if (!seen) {
    if (out.length && out[out.length - 1] !== "") out.push("");
    out.push(`${key}=${clean}`);
  }
  return out.join("\n").replace(/\n+$/, "\n");
}

export type SecretsSetInput = {
  key: string;
  value: string;
  env?: InfisicalEnvSlug;
  path?: InfisicalSecretPath;
  /** Skip laptop .env.local merge */
  skipLaptop?: boolean;
  /** Skip Worker push even if binding */
  skipCloud?: boolean;
};

export function parseSecretsSetInput(
  raw: Record<string, unknown>,
): SecretsSetInput | { error: string } {
  const key =
    typeof raw.key === "string"
      ? raw.key.trim()
      : typeof raw.name === "string"
        ? raw.name.trim()
        : "";
  if (!key || !isValidSecretKey(key)) {
    return {
      error:
        "key required — UPPER_SNAKE_CASE (e.g. ANTHROPIC_API_KEY, FOO_API_KEY)",
    };
  }
  const value =
    typeof raw.value === "string"
      ? raw.value
      : typeof raw.secretValue === "string"
        ? raw.secretValue
        : null;
  if (value === null || value === "") {
    return { error: "value required (non-empty string)" };
  }
  const env = resolveSecretEnv(raw.env ?? raw.environment);
  if (typeof env === "object" && env !== null && "error" in env) return env;
  const path = resolveSecretPath(key, raw.path ?? raw.secretPath);
  if (typeof path === "object" && path !== null && "error" in path) {
    return path;
  }
  return {
    key,
    value,
    env,
    path,
    skipLaptop: raw.skipLaptop === true,
    skipCloud: raw.skipCloud === true,
  };
}
