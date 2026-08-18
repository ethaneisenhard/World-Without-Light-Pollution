/**
 * Studio notification envelope (feed row) — shared client + server.
 */

import {
  isNotificationSourceId,
  type NotificationSourceId,
} from "./notification-prefs-pure.js";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export type NotificationHref = {
  kind: string;
  params?: Record<string, string>;
};

export type StudioNotification = {
  id: string;
  source: NotificationSourceId;
  severity: NotificationSeverity;
  title: string;
  body?: string;
  createdAt: number;
  readAt?: number | null;
  projectId?: string | null;
  href: NotificationHref;
};

export function createNotificationId(): string {
  return `notif_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Heal titles that baked in `[object Object]` (bad From party stringify).
 * "New email from [object Object]" → "New email"
 */
export function sanitizeNotificationTitle(title: string): string {
  let t = title.replace(/\[object Object\]/gi, "").replace(/\s{2,}/g, " ").trim();
  t = t.replace(/\s+from\s*$/i, "").trim();
  if (!t) return "Notification";
  return t.slice(0, 240);
}

export function isNotificationSeverity(
  raw: unknown,
): raw is NotificationSeverity {
  return (
    raw === "info" ||
    raw === "success" ||
    raw === "warning" ||
    raw === "error"
  );
}

export function parseNotificationHref(raw: unknown): NotificationHref | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  if (typeof rec.kind !== "string" || !rec.kind.trim()) return null;
  const href: NotificationHref = { kind: rec.kind.trim() };
  if (rec.params && typeof rec.params === "object" && !Array.isArray(rec.params)) {
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(rec.params as Record<string, unknown>)) {
      if (typeof v === "string") params[k] = v;
    }
    if (Object.keys(params).length) href.params = params;
  }
  return href;
}

export function normalizeStudioNotification(
  raw: unknown,
): StudioNotification | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  if (!isNotificationSourceId(rec.source)) return null;
  if (typeof rec.title !== "string" || !rec.title.trim()) return null;
  const href = parseNotificationHref(rec.href);
  if (!href) return null;
  const severity = isNotificationSeverity(rec.severity) ? rec.severity : "info";
  const createdAt =
    typeof rec.createdAt === "number" && Number.isFinite(rec.createdAt)
      ? rec.createdAt
      : Date.now();
  const id =
    typeof rec.id === "string" && rec.id.trim()
      ? rec.id.trim()
      : createNotificationId();
  const projectId =
    rec.projectId == null || rec.projectId === ""
      ? null
      : String(rec.projectId);
  const readAt =
    rec.readAt == null
      ? null
      : typeof rec.readAt === "number" && Number.isFinite(rec.readAt)
        ? rec.readAt
        : null;
  return {
    id,
    source: rec.source,
    severity,
    title: sanitizeNotificationTitle(rec.title.trim()),
    body:
      typeof rec.body === "string" && rec.body.trim()
        ? rec.body.trim().slice(0, 2000)
        : undefined,
    createdAt,
    readAt,
    projectId,
    href,
  };
}
