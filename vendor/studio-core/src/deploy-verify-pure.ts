/**
 * Ship / deploy verify — probe classify + chat receipt copy.
 * After a Cloud ship, never leave “forcing deploy.” as the last word.
 */

export type DeployProbeKind = "live" | "failed";

export type ChatShipReceiptFace = "pending" | "live" | "failed";

export type ChatShipReceipt = {
  face: ChatShipReceiptFace;
  title: string;
  body: string;
  url?: string;
};

export function userAskedToShip(userContent: string): boolean {
  const text = userContent.trim();
  if (!text) return false;
  return /\bship(\s+it|\s+this|\s+to\s+cloud)?\b|\bdeploy(\s+it|\s+this|\s+now|\s+to\s+cloud)?\b|\bpublish(\s+it|\s+this)?\b/i.test(
    text,
  );
}

export function looksLikeIncompleteShipNarration(content: string): boolean {
  const text = content.trim();
  if (!text) return false;
  if (/https?:\/\//i.test(text)) return false;
  if (
    /\b(it's live|is live|went through|shipped successfully|shipped to cloud|deployed successfully)\b/i.test(
      text,
    )
  ) {
    return false;
  }
  const tail = text.slice(-280);
  return (
    /\b(forcing|then)\s+deploy\b/i.test(tail) ||
    /\b(rebuilding|deploying|shipping|publishing|pushing)\b/i.test(tail)
  );
}

export function toolLooksLikeDeploy(name: string): boolean {
  const n = name.trim();
  if (!n) return false;
  return /deploy\.(ship|run|verify)|deploy[_-]?(ship|run|verify)|wrangler\s*deploy/i.test(
    n,
  );
}

export function toolLooksLikeRebuild(name: string, input?: unknown): boolean {
  const n = name.trim();
  if (n && toolLooksLikeDeploy(n)) return true;
  if (/rebuild/i.test(n)) return true;
  const blob =
    typeof input === "string"
      ? input
      : input && typeof input === "object"
        ? JSON.stringify(input)
        : "";
  if (!blob) return false;
  return /wrangler\s+deploy|pnpm\s+build:client|build:client|rebuild-client|deploy\.(ship|run)|npx\s+wrangler/i.test(
    blob,
  );
}

export type ChatTurnEventLike = {
  event: string;
  data?: unknown;
};

export function extractChatTurnToolNames(
  events: readonly ChatTurnEventLike[],
): string[] {
  const names: string[] = [];
  for (const e of events) {
    switch (e.event) {
      case "tool-start":
      case "tool-end": {
        const d =
          e.data && typeof e.data === "object" && !Array.isArray(e.data)
            ? (e.data as Record<string, unknown>)
            : {};
        const name = String(d.name ?? d.action ?? "").trim();
        if (name) names.push(name);
        break;
      }
      default:
        break;
    }
  }
  return names;
}

export function chatTurnLooksLikeShipRebuild(input: {
  tools?: ReadonlyArray<{ name?: string } | string>;
  events?: readonly ChatTurnEventLike[];
}): boolean {
  const names: string[] = [];
  for (const t of input.tools ?? []) {
    names.push(typeof t === "string" ? t : String(t.name ?? ""));
  }
  if (input.events) names.push(...extractChatTurnToolNames(input.events));
  for (const name of names) {
    if (toolLooksLikeDeploy(name) || toolLooksLikeRebuild(name)) return true;
  }
  for (const e of input.events ?? []) {
    switch (e.event) {
      case "tool-start":
      case "tool-end": {
        const d =
          e.data && typeof e.data === "object" && !Array.isArray(e.data)
            ? (e.data as Record<string, unknown>)
            : {};
        if (toolLooksLikeRebuild(String(d.name ?? ""), d.input ?? d.result)) {
          return true;
        }
        break;
      }
      default:
        break;
    }
  }
  return false;
}

export function chatShipReceiptShouldVerify(input: {
  userContent: string;
  assistantContent: string;
  tools?: ReadonlyArray<{ name?: string }>;
  hostTools?: readonly string[];
  /** Host scanned turn events (rebuild / wrangler / deploy.*) after reload. */
  hostShipRebuild?: boolean;
}): boolean {
  if (input.hostShipRebuild) return true;
  if (
    chatTurnLooksLikeShipRebuild({
      tools: [...(input.tools ?? []), ...(input.hostTools ?? [])],
    })
  ) {
    return true;
  }
  if (!userAskedToShip(input.userContent)) return false;
  return looksLikeIncompleteShipNarration(input.assistantContent);
}

export function classifyDeployProbe(input: {
  status: number;
  url: string;
}): DeployProbeKind {
  if (input.status >= 200 && input.status < 400) return "live";
  return "failed";
}

export function chatShipReceiptPending(): ChatShipReceipt {
  return {
    face: "pending",
    title: "Shipping to Cloud…",
    body: "Shipping to Cloud…",
  };
}

export function formatChatShipReceipt(input: {
  kind: DeployProbeKind;
  url: string;
}): ChatShipReceipt {
  switch (input.kind) {
    case "live":
      return {
        face: "live",
        title: "Shipped to Cloud",
        url: input.url || undefined,
        body: input.url
          ? `Shipped to Cloud.\n\n${input.url}\n\nChecked just now — the page loaded.`
          : "Shipped to Cloud.\n\nChecked just now — the page loaded.",
      };
    case "failed":
      return {
        face: "failed",
        title: "Couldn't confirm this ship",
        url: input.url || undefined,
        body: input.url
          ? `Couldn't confirm this ship landed.\n\n${input.url} didn't answer. Ask chat to ship again.`
          : "Couldn't confirm this ship landed.\n\nCloud didn't answer. Ask chat to ship again.",
      };
    default: {
      const _x: never = input.kind;
      return _x;
    }
  }
}

export function classifyDeployVerifyMcp(data: {
  ok?: boolean;
  verified?: boolean;
}): DeployProbeKind {
  if (data.ok === true && data.verified === true) return "live";
  return "failed";
}

export function receiptFromDeployVerifyMcp(data: {
  ok?: boolean;
  verified?: boolean;
  url?: string;
}): ChatShipReceipt {
  const kind = classifyDeployVerifyMcp(data);
  return formatChatShipReceipt({
    kind,
    url: typeof data.url === "string" ? data.url : "",
  });
}

export function resolveDeployVerifyUrl(input: {
  override?: string | null;
  prodUrl?: string | null;
}): string | null {
  const override = (input.override ?? "").trim();
  if (override) return override;
  const prod = (input.prodUrl ?? "").trim();
  return prod || null;
}
