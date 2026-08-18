import type {
  DataDestinationConfig,
  DataDestinationKind,
} from "./types.js";

/** Pure — parse one destination JSON blob. */
export function parseDataDestination(
  raw: unknown,
): DataDestinationConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim()) return null;
  if (typeof o.kind !== "string" || !o.kind.trim()) return null;
  const label =
    typeof o.label === "string" && o.label.trim()
      ? o.label.trim()
      : o.id.trim();
  const dest: DataDestinationConfig = {
    id: o.id.trim(),
    kind: o.kind.trim() as DataDestinationKind,
    label,
  };
  if (typeof o.binding === "string") dest.binding = o.binding;
  if (typeof o.localPath === "string") dest.localPath = o.localPath;
  if (Array.isArray(o.capabilities)) {
    dest.capabilities = o.capabilities.filter(
      (c): c is string => typeof c === "string",
    );
  }
  return dest;
}

/** Pure — resolve storage concern → destination id from project.json storage map. */
export function resolveStorageDestinationId(
  storage: Record<string, string> | null | undefined,
  concern: string,
): string | null {
  if (!storage) return null;
  const id = storage[concern];
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

export function defaultD1LocalPath(destinationId: string): string {
  return `.data/${destinationId}.sqlite`;
}
