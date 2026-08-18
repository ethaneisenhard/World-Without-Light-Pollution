export interface PlatformEventSpec {
  name: string;
  label: string;
  tier: "platform" | "engagement";
  consent: string;
  firedBy: string;
}

/** Platform catalog — Glass Box Studio tracking plan. */
export const PLATFORM_TRACKING_PLAN: readonly PlatformEventSpec[] = [
  {
    name: "pageview",
    label: "Page viewed",
    tier: "platform",
    consent: "analytics",
    firedBy: "analytics.page()",
  },
  {
    name: "consent_updated",
    label: "Consent updated",
    tier: "platform",
    consent: "strictly_necessary",
    firedBy: "Consent banner",
  },
  {
    name: "form_submitted",
    label: "Form submitted",
    tier: "platform",
    consent: "analytics",
    firedBy: "/api/forms/*",
  },
  {
    name: "form_error",
    label: "Form error",
    tier: "platform",
    consent: "analytics",
    firedBy: "/api/forms/*",
  },
  {
    name: "nav_link_clicked",
    label: "Nav link clicked",
    tier: "engagement",
    consent: "analytics",
    firedBy: "analytics bootstrap",
  },
  {
    name: "footer_link_clicked",
    label: "Footer link clicked",
    tier: "engagement",
    consent: "analytics",
    firedBy: "analytics bootstrap",
  },
  {
    name: "cta_clicked",
    label: "CTA clicked",
    tier: "engagement",
    consent: "analytics",
    firedBy: "analytics.track",
  },
];

const DEPRECATED_EVENT_NAMES = new Set([
  "scroll_cta_clicked",
  "outbound_link_clicked",
  "hero_cta_clicked",
]);

export function isDeprecatedEventName(name: string): boolean {
  return DEPRECATED_EVENT_NAMES.has(name) || (/_cta_clicked$/.test(name) && name !== "cta_clicked");
}

export interface TrackingPlanRow {
  name: string;
  label: string;
  tier: string;
  consent: string;
  declaredOn: string;
  properties: string[];
}

export interface DeclaredAnalyticsEvent {
  name: string;
  label?: string;
  consent?: string;
  payload?: Record<string, unknown>;
}

export function buildTrackingPlanRows(
  componentEvents: Record<string, DeclaredAnalyticsEvent[]> = {},
): TrackingPlanRow[] {
  const rows: TrackingPlanRow[] = PLATFORM_TRACKING_PLAN.map((e) => ({
    name: e.name,
    label: e.label,
    tier: e.tier,
    consent: e.consent,
    declaredOn: "platform",
    properties: [],
  }));

  for (const [componentId, events] of Object.entries(componentEvents)) {
    for (const decl of events) {
      rows.push({
        name: decl.name,
        label: decl.label ?? humanizeEventName(decl.name),
        tier: "engagement",
        consent: decl.consent ?? "analytics",
        declaredOn: componentId,
        properties: decl.payload ? Object.keys(decl.payload) : [],
      });
    }
  }

  return rows;
}

export function formatTrackingPlanMarkdown(rows: TrackingPlanRow[]): string {
  const lines = [
    "# Tracking plan",
    "",
    "| Event | Label | Tier | Consent | Declared on |",
    "| ----- | ----- | ---- | ------- | ----------- |",
  ];
  for (const r of rows) {
    lines.push(`| \`${r.name}\` | ${r.label} | ${r.tier} | ${r.consent} | ${r.declaredOn} |`);
  }
  return `${lines.join("\n")}\n`;
}

function humanizeEventName(name: string): string {
  return name
    .replace(/\./g, " ")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
