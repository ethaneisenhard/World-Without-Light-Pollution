/**
 * Ideal-stack (@theme) class map for `@glassbox-studio/components/directory`.
 * Studio uses chrome tokens; projects use paper/ink/line/accent.
 */

import type { DirectoryClasses } from "@glassbox-studio/components/directory";

export const starterDirectoryClasses: DirectoryClasses = {
  shell: "flex min-h-0 flex-1 flex-col gap-6",
  header: "flex flex-col gap-2",
  title: "m-0 font-display text-2xl font-semibold tracking-tight text-ink",
  lead: "m-0 max-w-[62ch] text-sm leading-relaxed text-ink-soft",
  layout: "flex min-h-0 flex-1 gap-8 max-md:flex-col",
  nav: "flex w-48 shrink-0 flex-col gap-5 max-md:w-full max-md:flex-row max-md:flex-wrap",
  navGroup: "flex flex-col gap-1",
  navLabel:
    "px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft",
  navBtn:
    "inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-transparent px-3 py-1.5 text-left text-sm text-ink hover:bg-sand",
  navBtnActive:
    "inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-left text-sm font-medium text-ink",
  main: "flex min-w-0 flex-1 flex-col gap-4",
  toolbar: "flex flex-wrap items-center gap-2",
  searchWrap:
    "flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-paper-raised px-3 py-2",
  search:
    "min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft",
  grid: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  empty: "m-0 px-4 py-8 text-center text-sm text-ink-soft",
  pager:
    "flex shrink-0 flex-row items-center justify-between gap-3 border-t border-line px-3.5 py-2",
  pagerMeta: "min-w-0 flex-1 truncate text-xs text-ink-soft",
  pagerActions: "inline-flex shrink-0 items-center gap-1.5",
  btn: "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-xs text-ink hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50",
  searchIcon: "size-4 shrink-0 text-ink-soft",
};

export const starterDirectoryCardClass =
  "flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-paper-raised p-4 text-left shadow-sm transition-colors hover:border-accent/40";

export const starterDirectoryCardIconClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-accent";

export const starterDirectoryBadgeClass =
  "inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-soft";
