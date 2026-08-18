/**
 * Generic directory filter / search / pagination (BrowserUI-inspired).
 * Pure — no DOM. Remix view lives in `@glassbox-studio/components/directory`.
 */

export type DirectoryNavGroup = {
  id: string;
  label: string;
  items: ReadonlyArray<{ id: string; label: string }>;
};

export type DirectoryPageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export function clampDirectoryPage(
  page: number,
  totalPages: number,
): number {
  const max = Math.max(1, totalPages);
  if (!Number.isFinite(page) || page < 1) return 1;
  if (page > max) return max;
  return Math.floor(page);
}

export function paginateDirectory<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): DirectoryPageResult<T> {
  const size =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 9;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size) || 1);
  const safePage = clampDirectoryPage(page, totalPages);
  const start = (safePage - 1) * size;
  return {
    items: items.slice(start, start + size) as T[],
    page: safePage,
    pageSize: size,
    total,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

/** Case-insensitive match against one or more string fields. */
export function filterDirectoryByQuery<T>(
  items: readonly T[],
  query: string,
  fields: (item: T) => readonly (string | null | undefined)[],
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...items];
  return items.filter((item) =>
    fields(item).some((f) => (f ?? "").toLowerCase().includes(q)),
  );
}

export function filterDirectoryByCategory<T>(
  items: readonly T[],
  categoryId: string,
  match: (item: T, categoryId: string) => boolean,
): T[] {
  const id = categoryId.trim().toLowerCase();
  if (!id || id === "all") return [...items];
  return items.filter((item) => match(item, id));
}
