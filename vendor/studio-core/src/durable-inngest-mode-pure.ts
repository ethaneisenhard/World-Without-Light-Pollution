/**
 * Inngest local modes — stub vs Dev Server (no I/O).
 */

/** Event Studio emits when HITL Approve resumes a wait step. */
export const INNGEST_DURABLE_SIGNAL_EVENT = "task/approved";

/**
 * Real Dev Server path when BASE_URL or USE_SERVER set.
 * `INNGEST_STUB=1` always forces in-process memoized runner.
 */
export function useInngestDevServer(
  envGet: (name: string) => string | undefined,
): boolean {
  if (envGet("INNGEST_STUB")?.trim() === "1") return false;
  if (envGet("INNGEST_USE_SERVER")?.trim() === "1") return true;
  return Boolean(envGet("INNGEST_BASE_URL")?.trim());
}

/** Event API base — Dev Server default :8288, else cloud inn.gs. */
export function resolveInngestEventApiBase(
  envGet: (name: string) => string | undefined,
): string {
  const explicit =
    envGet("INNGEST_EVENT_API_BASE")?.trim() ||
    envGet("INNGEST_BASE_URL")?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (useInngestDevServer(envGet)) {
    return "http://127.0.0.1:8288";
  }
  return "https://inn.gs";
}

/** Dummy key is fine for local Dev Server. */
export function resolveInngestEventKey(
  envGet: (name: string) => string | undefined,
): string | undefined {
  const key = envGet("INNGEST_EVENT_KEY")?.trim();
  if (key) return key;
  if (useInngestDevServer(envGet)) return "local";
  return undefined;
}
