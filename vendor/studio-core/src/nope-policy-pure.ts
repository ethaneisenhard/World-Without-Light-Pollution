/**
 * Studio NOPE security policy — browser-safe types + posture/group mapping.
 * Server builds a real @agnt-gg/nope instance from {@link NopeBuildPlan}.
 */

export const NOPE_CATEGORIES = [
  "containers",
  "credentials",
  "database",
  "exfiltration",
  "filesystem",
  "git",
  "injection",
  "network",
  "packages",
  "system",
] as const;

export type NopeCategory = (typeof NOPE_CATEGORIES)[number];

export type NopeGroupDefault = "allow" | "audit" | "block";

export type NopePosture =
  | "off"
  | "observe"
  | "balanced"
  | "strict"
  | "custom";

export type StudioNopePolicy = {
  posture: NopePosture;
  groups: Partial<Record<NopeCategory, NopeGroupDefault>>;
  /** Rule ids to remove (Manage-rules UI later). */
  disabledRules: string[];
};

export type StudioSecurityConfig = {
  nope: StudioNopePolicy;
};

/** Server build instructions — no @agnt-gg/nope import here. */
export type NopeBuildPlan =
  | { kind: "off" }
  | {
      kind: "preset";
      preset: "audit" | "standard" | "paranoid";
      telemetry: boolean;
    }
  | {
      kind: "custom";
      /** Base preset before removes. */
      basePreset: "standard";
      mode: "strict" | "warn" | "audit";
      threshold: "critical" | "high" | "medium" | "low";
      removeCategories: NopeCategory[];
      disabledRules: string[];
      telemetry: boolean;
      sanitizeMode: "enforce" | "report" | "off";
    };

export type NopePostureCard = {
  posture: NopePosture;
  title: string;
  eyebrow: string;
  lead: string;
};

export type NopeGroupCatalogRow = {
  id: NopeCategory;
  label: string;
  hint: string;
};

const POSTURES: readonly NopePosture[] = [
  "off",
  "observe",
  "balanced",
  "strict",
  "custom",
] as const;

export function defaultStudioNopePolicy(): StudioNopePolicy {
  return {
    posture: "balanced",
    groups: {},
    disabledRules: [],
  };
}

export function defaultStudioSecurityConfig(): StudioSecurityConfig {
  return { nope: defaultStudioNopePolicy() };
}

export function parseNopePosture(raw: unknown): NopePosture {
  if (typeof raw === "string" && (POSTURES as readonly string[]).includes(raw)) {
    return raw as NopePosture;
  }
  return "balanced";
}

export function parseNopeGroupDefault(raw: unknown): NopeGroupDefault | null {
  if (raw === "allow" || raw === "audit" || raw === "block") return raw;
  return null;
}

export function parseStudioNopePolicy(raw: unknown): StudioNopePolicy {
  const base = defaultStudioNopePolicy();
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return base;
  }
  const o = raw as Record<string, unknown>;
  const groups: Partial<Record<NopeCategory, NopeGroupDefault>> = {};
  if (typeof o.groups === "object" && o.groups !== null && !Array.isArray(o.groups)) {
    const g = o.groups as Record<string, unknown>;
    for (const cat of NOPE_CATEGORIES) {
      const parsed = parseNopeGroupDefault(g[cat]);
      if (parsed) groups[cat] = parsed;
    }
  }
  const disabledRules = Array.isArray(o.disabledRules)
    ? o.disabledRules
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        .map((id) => id.trim())
        .slice(0, 200)
    : [];
  return {
    posture: parseNopePosture(o.posture),
    groups,
    disabledRules,
  };
}

export function parseStudioSecurityConfig(raw: unknown): StudioSecurityConfig {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return defaultStudioSecurityConfig();
  }
  const o = raw as Record<string, unknown>;
  return { nope: parseStudioNopePolicy(o.nope) };
}

/** Merge security patch onto current (object fields merge). */
export function mergeStudioSecurityPatch(
  current: StudioSecurityConfig,
  patch: unknown,
): StudioSecurityConfig {
  if (typeof patch !== "object" || patch === null || Array.isArray(patch)) {
    return current;
  }
  const o = patch as Record<string, unknown>;
  if (o.nope === undefined) return current;
  if (typeof o.nope !== "object" || o.nope === null || Array.isArray(o.nope)) {
    return current;
  }
  const n = o.nope as Record<string, unknown>;
  const next: StudioNopePolicy = {
    posture: current.nope.posture,
    groups: { ...current.nope.groups },
    disabledRules: [...current.nope.disabledRules],
  };
  if (n.posture !== undefined) {
    next.posture = parseNopePosture(n.posture);
  }
  if (n.groups !== undefined) {
    if (typeof n.groups === "object" && n.groups !== null && !Array.isArray(n.groups)) {
      const g = n.groups as Record<string, unknown>;
      for (const cat of NOPE_CATEGORIES) {
        if (g[cat] === null) {
          delete next.groups[cat];
          continue;
        }
        const parsed = parseNopeGroupDefault(g[cat]);
        if (parsed) next.groups[cat] = parsed;
      }
    }
  }
  if (n.disabledRules !== undefined) {
    next.disabledRules = Array.isArray(n.disabledRules)
      ? n.disabledRules
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
          .map((id) => id.trim())
          .slice(0, 200)
      : [];
  }
  return { nope: next };
}

export function nopePostureCards(): NopePostureCard[] {
  return [
    {
      posture: "off",
      title: "Off",
      eyebrow: "No guardrails",
      lead: "Allow every tool action. No NOPE checks or secret scrub.",
    },
    {
      posture: "observe",
      title: "Observe",
      eyebrow: "Audit only",
      lead: "Log risky actions without blocking. Secrets reported, not redacted.",
    },
    {
      posture: "balanced",
      title: "Balanced",
      eyebrow: "Recommended",
      lead: "Block critical risks. Standard NOPE preset with telemetry.",
    },
    {
      posture: "strict",
      title: "Strict",
      eyebrow: "High + critical",
      lead: "Paranoid preset — tighter threshold, scanners, enforced SSRF.",
    },
    {
      posture: "custom",
      title: "Custom",
      eyebrow: "Tune layers",
      lead: "Set Allow / Audit / Block per policy group.",
    },
  ];
}

export function nopeGroupCatalog(): NopeGroupCatalogRow[] {
  return [
    {
      id: "containers",
      label: "Containers",
      hint: "Privileged execution, host mounts, and dangerous capabilities.",
    },
    {
      id: "credentials",
      label: "Credentials",
      hint: "API keys, tokens, credential files, and environment secrets.",
    },
    {
      id: "database",
      label: "Database",
      hint: "Schema changes and unbounded data mutations.",
    },
    {
      id: "exfiltration",
      label: "Exfiltration",
      hint: "Sensitive data uploads, archives, pipes, and encoding.",
    },
    {
      id: "filesystem",
      label: "Filesystem",
      hint: "Files, protected paths, permissions, and destructive writes.",
    },
    {
      id: "git",
      label: "Git",
      hint: "History rewrites, forced pushes, and destructive repository actions.",
    },
    {
      id: "injection",
      label: "Injection",
      hint: "Eval, exec, shell pipes, and code-injection patterns.",
    },
    {
      id: "network",
      label: "Network",
      hint: "Private IPs, localhost, cloud metadata, and SSRF-prone URLs.",
    },
    {
      id: "packages",
      label: "Packages",
      hint: "Global installs and untrusted package execution.",
    },
    {
      id: "system",
      label: "System",
      hint: "Shutdown, kill, firewall flush, crontab, and privilege escalations.",
    },
  ];
}

/**
 * Effective group default for UI (read-only when posture ≠ custom).
 * Empty custom groups fall back to block.
 */
export function effectiveNopeGroupDefault(
  policy: StudioNopePolicy,
  category: NopeCategory,
): NopeGroupDefault {
  switch (policy.posture) {
    case "off":
      return "allow";
    case "observe":
      return "audit";
    case "balanced":
    case "strict":
      return "block";
    case "custom":
      return policy.groups[category] ?? "block";
    default:
      return "block";
  }
}

/** Pure plan the server uses to construct a NOPE instance. */
export function planNopeBuild(policy: StudioNopePolicy): NopeBuildPlan {
  switch (policy.posture) {
    case "off":
      return { kind: "off" };
    case "observe":
      return { kind: "preset", preset: "audit", telemetry: true };
    case "balanced":
      return { kind: "preset", preset: "standard", telemetry: true };
    case "strict":
      return { kind: "preset", preset: "paranoid", telemetry: true };
    case "custom": {
      const removeCategories: NopeCategory[] = [];
      let anyBlock = false;
      let anyAudit = false;
      for (const cat of NOPE_CATEGORIES) {
        const d = policy.groups[cat] ?? "block";
        if (d === "allow") removeCategories.push(cat);
        else if (d === "audit") anyAudit = true;
        else anyBlock = true;
      }
      let mode: "strict" | "warn" | "audit" = "strict";
      if (!anyBlock && anyAudit) mode = "warn";
      else if (!anyBlock && !anyAudit) mode = "audit";
      return {
        kind: "custom",
        basePreset: "standard",
        mode,
        threshold: "high",
        removeCategories,
        disabledRules: [...policy.disabledRules],
        telemetry: true,
        sanitizeMode: mode === "audit" ? "report" : "enforce",
      };
    }
    default:
      return { kind: "preset", preset: "standard", telemetry: true };
  }
}

export function isNopeCategory(id: string): id is NopeCategory {
  return (NOPE_CATEGORIES as readonly string[]).includes(id);
}
