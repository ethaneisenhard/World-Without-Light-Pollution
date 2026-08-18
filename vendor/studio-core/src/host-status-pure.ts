/**
 * Host desk health projections — pure (no os/fs).
 * UI + API share formatters and warn/critical thresholds.
 */

export type HostMemorySnapshot = {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
};

export type HostDiskSnapshot = {
  path: string;
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
};

export type HostRuntimeSlotSnapshot = {
  runtime: "wrangler" | "node";
  running: number;
  limit: number;
};

export type HostProcessRssSnapshot = {
  key: string;
  projectId: string;
  serverId: string;
  pid: number;
  rssBytes: number | null;
};

export type HostStatusSnapshot = {
  ok: true;
  hostname: string;
  platform: string;
  /** Seconds since Host process boot (Node uptime), not OS uptime. */
  processUptimeSec: number;
  memory: HostMemorySnapshot;
  load: number[];
  disk: HostDiskSnapshot | null;
  slots: HostRuntimeSlotSnapshot[];
  processes: HostProcessRssSnapshot[];
};

export type HostHealthLevel = "ok" | "warn" | "critical";

/** Memory used ratio thresholds (0–1). */
export const HOST_MEMORY_WARN_RATIO = 0.8;
export const HOST_MEMORY_CRITICAL_RATIO = 0.92;

/** Disk free ratio thresholds (free/total). */
export const HOST_DISK_WARN_FREE_RATIO = 0.15;
export const HOST_DISK_CRITICAL_FREE_RATIO = 0.08;

export function hostMemoryUsedRatio(memory: HostMemorySnapshot): number {
  if (memory.totalBytes <= 0) return 0;
  return memory.usedBytes / memory.totalBytes;
}

export function hostDiskFreeRatio(disk: HostDiskSnapshot): number {
  if (disk.totalBytes <= 0) return 1;
  return disk.freeBytes / disk.totalBytes;
}

export function hostMemoryHealthLevel(
  memory: HostMemorySnapshot,
): HostHealthLevel {
  const ratio = hostMemoryUsedRatio(memory);
  if (ratio >= HOST_MEMORY_CRITICAL_RATIO) return "critical";
  if (ratio >= HOST_MEMORY_WARN_RATIO) return "warn";
  return "ok";
}

export function hostDiskHealthLevel(
  disk: HostDiskSnapshot | null,
): HostHealthLevel {
  if (!disk) return "ok";
  const free = hostDiskFreeRatio(disk);
  if (free <= HOST_DISK_CRITICAL_FREE_RATIO) return "critical";
  if (free <= HOST_DISK_WARN_FREE_RATIO) return "warn";
  return "ok";
}

export function hostSlotsHealthLevel(
  slots: ReadonlyArray<HostRuntimeSlotSnapshot>,
): HostHealthLevel {
  let level: HostHealthLevel = "ok";
  for (const s of slots) {
    if (s.limit <= 0) continue;
    if (s.running >= s.limit) return "critical";
    if (s.running / s.limit >= 0.75) level = "warn";
  }
  return level;
}

/** Worst of memory / disk / slots. */
export function hostOverallHealthLevel(
  input: Pick<HostStatusSnapshot, "memory" | "disk" | "slots">,
): HostHealthLevel {
  const levels = [
    hostMemoryHealthLevel(input.memory),
    hostDiskHealthLevel(input.disk),
    hostSlotsHealthLevel(input.slots),
  ];
  if (levels.includes("critical")) return "critical";
  if (levels.includes("warn")) return "warn";
  return "ok";
}

export function formatHostBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  if (i === 0) return `${Math.round(n)} ${units[i]}`;
  const rounded = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
  return `${rounded} ${units[i]}`;
}

export function formatHostPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return "—";
  return `${Math.round(ratio * 100)}%`;
}

export function formatHostLoad(load: ReadonlyArray<number>): string {
  if (!load.length) return "—";
  return load
    .slice(0, 3)
    .map((n) => (Number.isFinite(n) ? n.toFixed(2) : "—"))
    .join(" · ");
}

export function formatHostSlotLabel(slot: HostRuntimeSlotSnapshot): string {
  return `${slot.runtime} ${slot.running}/${slot.limit}`;
}

export function formatHostSlotsLine(
  slots: ReadonlyArray<HostRuntimeSlotSnapshot>,
): string {
  return slots.map(formatHostSlotLabel).join(" · ");
}

export function hostHealthLabel(level: HostHealthLevel): string {
  if (level === "critical") return "Critical";
  if (level === "warn") return "Elevated";
  return "Healthy";
}
