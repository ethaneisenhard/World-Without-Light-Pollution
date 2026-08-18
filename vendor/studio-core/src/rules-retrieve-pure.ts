/**
 * Rules into-chat packs — Always-on / Auto / Manual (same names as Memory).
 *
 * - Always-on: enabled, path is not a glob
 * - Auto: enabled, path contains * and matches the turn path
 * - Manual: disabled (not packed until operator enables)
 */

import type { MergedRule } from "./rules-manifest-pure.js";

export type RuleReceiptPack = "always-on" | "auto" | "manual";

export function rulePathIsGlob(path: string): boolean {
  return path.includes("*") || path.includes("?");
}

/** Minimal glob: ** and * segments; case-sensitive path match. */
export function pathMatchesRuleGlob(filePath: string, glob: string): boolean {
  const path = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  const g = glob.replace(/\\/g, "/").trim();
  if (!g) return false;
  if (!rulePathIsGlob(g)) {
    return path === g || path.endsWith(`/${g}`) || path.startsWith(`${g}/`);
  }
  const escaped = g
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/{{GLOBSTAR}}/g, ".*");
  try {
    return new RegExp(`^${escaped}$`).test(path);
  } catch {
    return false;
  }
}

export function classifyRulePack(rule: MergedRule): RuleReceiptPack {
  if (!rule.enabled) return "manual";
  if (rulePathIsGlob(rule.path)) return "auto";
  return "always-on";
}

export function formatRuleReceiptPackLabel(pack: RuleReceiptPack): string {
  if (pack === "always-on") return "Always-on rule";
  if (pack === "auto") return "Auto rule";
  return "Manual rule";
}

export function selectRulesForTurn(input: {
  merged: readonly MergedRule[];
  /** Open file / focus path for Auto match; null = Always-on only. */
  path?: string | null;
}): {
  alwaysOn: MergedRule[];
  auto: MergedRule[];
  selected: MergedRule[];
} {
  const alwaysOn: MergedRule[] = [];
  const auto: MergedRule[] = [];
  const path = input.path?.trim() || null;
  for (const rule of input.merged) {
    const pack = classifyRulePack(rule);
    if (pack === "manual") continue;
    if (pack === "always-on") {
      alwaysOn.push(rule);
      continue;
    }
    if (path && pathMatchesRuleGlob(path, rule.path)) {
      auto.push(rule);
    }
  }
  return {
    alwaysOn,
    auto,
    selected: [...alwaysOn, ...auto],
  };
}

/** Parse selected path from Studio chat context block (viewport lines). */
export function selectedPathFromChatContext(context: string): string | null {
  const m = context.match(/^- selected file\/path:\s*(.+)$/m);
  if (!m) return null;
  const v = m[1]!.trim();
  if (!v || v === "(none)") return null;
  return v;
}
