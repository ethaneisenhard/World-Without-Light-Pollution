/**
 * Inngest substrate — config probe + handoff copy (no I/O).
 * Adapter in studio-server maps graphs onto step.run / waitForEvent / sendEvent.
 */

import type { DurableSubstrateReadiness } from "./durable-runtime-registry-pure.js";

/** Event name Studio emits when a durable run is requested (cloud / future function). */
export const INNGEST_DURABLE_RUN_EVENT = "studio/durable.run.requested";

export function isInngestConfigured(envGet: (name: string) => string | undefined): boolean {
  if (envGet("INNGEST_DEV")?.trim() === "1") return true;
  return Boolean(envGet("INNGEST_EVENT_KEY")?.trim());
}

export function inngestSubstrateReadiness(
  envGet: (name: string) => string | undefined,
): DurableSubstrateReadiness {
  return isInngestConfigured(envGet) ? "ready" : "planned";
}

export function inngestUnconfiguredHandoff(): string {
  return [
    "Inngest durable substrate not configured yet.",
    "",
    "Studio owns the run graph; Inngest runs memoized steps / wait / fan-out.",
    "",
    "Plug-in steps:",
    "1. Stub dogfood: INNGEST_DEV=1 (in-process Inngest-shaped runner)",
    "2. Real local Dev Server:",
    "   AS_LOCAL_HOST=1 pnpm serve   # Host :3847 with /api/inngest",
    "   pnpm inngest:dev             # CLI → http://127.0.0.1:8288",
    "   INNGEST_DEV=1 INNGEST_USE_SERVER=1 INNGEST_EVENT_KEY=local",
    "3. Cloud: INNGEST_EVENT_KEY=<key> (+ optional INNGEST_EVENT_API_BASE)",
    "",
    "Until then, DurableRuntime degrades background runs to the fake substrate.",
  ].join("\n");
}
