import { buildTrackingPlanRows } from "./tracking-plan.js";
import type { DeclaredAnalyticsEvent } from "./tracking-plan.js";

export interface ConsentTransparencyRow {
  kind: "script" | "event";
  id: string;
  label: string;
  consent: string;
}

export interface ScriptDeclaration {
  id: string;
  label: string;
  consent: string;
}

export function buildConsentTransparencyRows(opts: {
  scripts?: ScriptDeclaration[];
  componentEvents?: Record<string, DeclaredAnalyticsEvent[]>;
}): ConsentTransparencyRow[] {
  const rows: ConsentTransparencyRow[] = [];

  for (const script of opts.scripts ?? []) {
    rows.push({
      kind: "script",
      id: script.id,
      label: script.label,
      consent: script.consent,
    });
  }

  for (const row of buildTrackingPlanRows(opts.componentEvents ?? {})) {
    rows.push({
      kind: "event",
      id: row.name,
      label: row.label,
      consent: row.consent,
    });
  }

  return rows.sort((a, b) => a.consent.localeCompare(b.consent) || a.label.localeCompare(b.label));
}
