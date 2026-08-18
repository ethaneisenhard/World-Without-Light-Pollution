/**
 * Media library filter / sort / format — BrowserUI-shaped, pure (no I/O).
 */

export type MediaLibraryTypeFilter = "all" | "images" | "other";
export type MediaLibraryDateFilter =
  | "all"
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "year";
export type MediaLibrarySort = "newest" | "oldest" | "name";

export type MediaLibraryItem = {
  id: string;
  filename: string;
  contentType: string;
  bytes: number;
  alt?: string;
  tags?: string[];
  /** Epoch ms or ISO string */
  updatedAt: number | string;
  createdAt?: number | string;
};

export function mediaUpdatedAtMs(item: MediaLibraryItem): number {
  const v = item.updatedAt;
  if (typeof v === "number") return v;
  const n = Date.parse(v);
  return Number.isNaN(n) ? 0 : n;
}

export function mediaFileTypeLabel(ct: string): string {
  if (ct.startsWith("image/")) return "IMG";
  if (ct.includes("pdf")) return "PDF";
  if (ct.startsWith("video/")) return "VID";
  if (ct.startsWith("audio/")) return "AUD";
  return "FILE";
}

export function mediaFileTypeBadge(item: {
  contentType: string;
  filename?: string;
}): string {
  const fromName = item.filename?.split(".").pop()?.toUpperCase();
  if (fromName && fromName.length >= 2 && fromName.length <= 5) return fromName;
  const ct = item.contentType.toLowerCase();
  if (ct === "image/png") return "PNG";
  if (ct === "image/jpeg" || ct === "image/jpg") return "JPG";
  if (ct === "image/webp") return "WEBP";
  if (ct === "image/gif") return "GIF";
  if (ct === "image/svg+xml") return "SVG";
  if (ct.includes("pdf")) return "PDF";
  if (ct.startsWith("video/")) return "VID";
  if (ct.startsWith("audio/")) return "AUD";
  return mediaFileTypeLabel(item.contentType);
}

export function mediaReadableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mediaFormatDate(isoOrMs: number | string): string {
  try {
    const d =
      typeof isoOrMs === "number" ? new Date(isoOrMs) : new Date(isoOrMs);
    if (Number.isNaN(d.getTime())) return String(isoOrMs);
    return d.toLocaleString();
  } catch {
    return String(isoOrMs);
  }
}

export function mediaFormatDateShort(isoOrMs: number | string): string {
  try {
    const d =
      typeof isoOrMs === "number" ? new Date(isoOrMs) : new Date(isoOrMs);
    if (Number.isNaN(d.getTime())) return String(isoOrMs);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(isoOrMs);
  }
}

export function mediaPassesDateFilter(
  updatedAt: number | string,
  filter: MediaLibraryDateFilter,
  now = Date.now(),
): boolean {
  if (filter === "all") return true;
  const ts =
    typeof updatedAt === "number" ? updatedAt : Date.parse(updatedAt);
  if (Number.isNaN(ts)) return true;
  if (filter === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return ts >= start.getTime();
  }
  if (filter === "7d") return now - ts <= 7 * 86_400_000;
  if (filter === "30d") return now - ts <= 30 * 86_400_000;
  if (filter === "90d") return now - ts <= 90 * 86_400_000;
  if (filter === "year")
    return new Date(ts).getFullYear() === new Date(now).getFullYear();
  return true;
}

export function filterAndSortMediaItems(
  items: readonly MediaLibraryItem[],
  opts: {
    query?: string;
    typeFilter?: MediaLibraryTypeFilter;
    dateFilter?: MediaLibraryDateFilter;
    sortBy?: MediaLibrarySort;
    now?: number;
  } = {},
): MediaLibraryItem[] {
  const query = (opts.query ?? "").trim().toLowerCase();
  const typeFilter = opts.typeFilter ?? "all";
  const dateFilter = opts.dateFilter ?? "all";
  const sortBy = opts.sortBy ?? "newest";
  const now = opts.now ?? Date.now();

  let res = [...items];
  if (query) {
    res = res.filter((it) => {
      const hay =
        `${it.id} ${it.filename ?? ""} ${mediaFormatDate(it.updatedAt)} ${mediaFormatDateShort(it.updatedAt)}`.toLowerCase();
      return hay.includes(query);
    });
  }
  if (typeFilter === "images")
    res = res.filter((it) => it.contentType.startsWith("image/"));
  if (typeFilter === "other")
    res = res.filter((it) => !it.contentType.startsWith("image/"));
  res = res.filter((it) =>
    mediaPassesDateFilter(it.updatedAt, dateFilter, now),
  );

  return res.sort((a, b) => {
    if (sortBy === "name")
      return (a.filename || a.id).localeCompare(b.filename || b.id);
    const da = mediaUpdatedAtMs(a);
    const db = mediaUpdatedAtMs(b);
    return sortBy === "oldest" ? da - db : db - da;
  });
}

export function mediaCountLabel(
  filteredLen: number,
  totalLen: number,
): string {
  if (filteredLen === totalLen)
    return `${totalLen} item${totalLen === 1 ? "" : "s"}`;
  return `${filteredLen} of ${totalLen} items`;
}

export function mediaContentUrl(
  scope: "project" | "studio",
  projectId: string | undefined,
  assetId: string,
): string {
  if (scope === "studio")
    return `/api/studio/media/${encodeURIComponent(assetId)}`;
  return `/api/projects/${encodeURIComponent(projectId ?? "")}/media/${encodeURIComponent(assetId)}`;
}
