/**
 * Class slots for Directory — hosts pass Tailwind (Studio chrome or project @theme).
 */

export type DirectoryClasses = {
  shell: string;
  header: string;
  title: string;
  lead: string;
  layout: string;
  nav: string;
  navGroup: string;
  navLabel: string;
  navBtn: string;
  navBtnActive: string;
  main: string;
  toolbar: string;
  searchWrap: string;
  search: string;
  grid: string;
  empty: string;
  pager: string;
  pagerMeta: string;
  /** Prev/Next cluster — one flex peer opposite pagerMeta under justify-between. */
  pagerActions: string;
  btn: string;
  /** Optional: icon inside search field */
  searchIcon?: string;
};

/** Structural defaults only — no color brand. Hosts override with tokens. */
export const DIRECTORY_CLASS_DEFAULTS: DirectoryClasses = {
  shell: "flex min-h-0 min-w-0 flex-1 flex-col gap-4",
  header: "flex flex-col gap-1",
  title: "m-0 text-lg font-semibold tracking-tight",
  lead: "m-0 max-w-[62ch] text-sm leading-relaxed opacity-80",
  layout: "flex min-h-0 min-w-0 flex-1 gap-4 max-md:flex-col max-md:gap-2",
  nav: "flex w-44 shrink-0 flex-col gap-4 max-md:w-full max-md:flex-row max-md:flex-nowrap max-md:items-center max-md:gap-2 max-md:overflow-x-auto",
  navGroup:
    "flex flex-col gap-1 max-md:min-w-0 max-md:flex-1 max-md:flex-row max-md:flex-nowrap max-md:items-center max-md:gap-1.5 max-md:overflow-x-auto",
  navLabel:
    "px-1 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-70 max-md:shrink-0 max-md:px-0",
  navBtn:
    "inline-flex min-h-8 cursor-pointer items-center rounded-md border border-transparent px-2.5 py-1.5 text-left text-sm max-md:min-h-9 max-md:shrink-0 max-md:whitespace-nowrap max-md:px-3",
  navBtnActive:
    "inline-flex min-h-8 cursor-pointer items-center rounded-md border px-2.5 py-1.5 text-left text-sm font-medium max-md:min-h-9 max-md:shrink-0 max-md:whitespace-nowrap max-md:px-3",
  /** Hosts should scope card-grid CQs to this column (`@container`), not the outer pane. */
  main: "@container flex min-w-0 flex-1 flex-col gap-3",
  toolbar: "flex flex-wrap items-center gap-2",
  searchWrap:
    "flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5",
  search:
    "min-w-0 flex-1 border-0 bg-transparent text-sm outline-none",
  grid: "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
  empty: "m-0 px-4 py-6 text-center text-sm opacity-70",
  /** Always one row — hosts must not pass flex-wrap / flex-col. */
  pager:
    "flex shrink-0 flex-row items-center justify-between gap-3 border-t px-3.5 py-2",
  pagerMeta: "min-w-0 flex-1 truncate text-xs leading-none opacity-70",
  pagerActions: "inline-flex shrink-0 items-center gap-1.5",
  btn: "inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50",
  searchIcon: "size-4 shrink-0 opacity-60",
};

export function mergeDirectoryClasses(
  override?: Partial<DirectoryClasses> | null,
): DirectoryClasses {
  if (!override) return { ...DIRECTORY_CLASS_DEFAULTS };
  return { ...DIRECTORY_CLASS_DEFAULTS, ...override };
}
