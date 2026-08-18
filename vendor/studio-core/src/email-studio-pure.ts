/**
 * Email Studio UI / deliverability projections — pure, no I/O.
 */

export const EMAIL_STUDIO_TABS = [
  "campaigns",
  "audiences",
  "deliverability",
] as const;

export type EmailStudioTab = (typeof EMAIL_STUDIO_TABS)[number];

export function parseEmailStudioTab(
  raw: string | null | undefined,
): EmailStudioTab {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "audiences" || v === "campaigns" || v === "deliverability") {
    return v;
  }
  return "campaigns";
}

export type DeliverabilityChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
  hint?: string;
};

export type DeliverabilityProjectionInput = {
  providerPlugin: string;
  fallbackDryRun?: boolean;
  fallbackReason?: string;
  domain?: string;
  fromDomains?: string[];
  spf?: boolean;
  dkim?: boolean;
  dmarc?: boolean;
  hasCloudflareCreds?: boolean;
};

export function projectDeliverabilityChecklist(
  input: DeliverabilityProjectionInput,
): DeliverabilityChecklistItem[] {
  const isCf =
    input.providerPlugin.includes("cloudflare") ||
    Boolean(input.fallbackDryRun);
  const items: DeliverabilityChecklistItem[] = [
    {
      id: "provider",
      label: `Provider: ${input.providerPlugin}`,
      ok: !input.fallbackDryRun,
      hint: input.fallbackReason,
    },
  ];
  if (isCf || input.providerPlugin.includes("cloudflare")) {
    items.push({
      id: "cf-creds",
      label: "Cloudflare account + Email Sending API token",
      ok: Boolean(input.hasCloudflareCreds) && !input.fallbackDryRun,
      hint: input.hasCloudflareCreds
        ? undefined
        : "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_EMAIL_API_TOKEN",
    });
  }
  items.push(
    {
      id: "domain",
      label: "Sending domain configured",
      ok: Boolean(input.domain?.trim() || (input.fromDomains?.length ?? 0) > 0),
      hint: input.domain || input.fromDomains?.join(", ") || "Set domain in email/deliverability.json",
    },
    {
      id: "spf",
      label: "SPF",
      ok: input.spf === true,
      hint: input.spf === true ? undefined : "Publish SPF including Cloudflare / your MTA",
    },
    {
      id: "dkim",
      label: "DKIM",
      ok: input.dkim === true,
      hint: input.dkim === true ? undefined : "Enable DKIM for the sending domain",
    },
    {
      id: "dmarc",
      label: "DMARC",
      ok: input.dmarc === true,
      hint: input.dmarc === true ? undefined : "Add a DMARC policy record",
    },
  );
  return items;
}

export function campaignSendPath(
  projectId: string,
  campaignId: string,
): string {
  return `/api/projects/${encodeURIComponent(projectId)}/email/campaigns/${encodeURIComponent(campaignId)}/send`;
}
