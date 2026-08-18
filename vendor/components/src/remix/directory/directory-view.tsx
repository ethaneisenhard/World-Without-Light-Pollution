/** @jsxImportSource remix/ui */
/**
 * Headless directory view — structure + events; classes from host.
 */

import { MagnifyingGlassIcon } from "@glassbox-studio/ui-icons/24/outline/magnifying-glass";
import {
  mergeDirectoryClasses,
  type DirectoryClasses,
} from "./directory-classes.js";
import type {
  DirectoryNavGroup,
  DirectoryPageResult,
} from "./directory-pure.js";

export type DirectoryViewProps<T> = {
  /** remix/ui `on` binder from the host. */
  on: (type: string, handler: (e: Event) => void) => unknown;
  title: string;
  lead?: string;
  navGroups: readonly DirectoryNavGroup[];
  category: () => string;
  setCategory: (id: string) => void;
  search: () => string;
  setSearch: (q: string) => void;
  pageResult: () => DirectoryPageResult<T>;
  setPage: (page: number) => void;
  renderCard: (entry: T) => unknown;
  toolbarExtra?: () => unknown;
  emptyLabel?: string;
  classes?: Partial<DirectoryClasses> | null;
  /** data-as-component stamp */
  componentId?: string;
  searchPlaceholder?: string;
  /** Optional chrome pager (e.g. studioPager). Default = headless meta + Prev/Next. */
  renderPager?: (ctx: {
    page: number;
    totalPages: number;
    total: number;
    hasPrev: boolean;
    hasNext: boolean;
    setPage: (page: number) => void;
  }) => unknown;
};

export function renderDirectory<T>(props: DirectoryViewProps<T>) {
  const {
    on,
    title,
    lead,
    navGroups,
    category,
    setCategory,
    search,
    setSearch,
    pageResult,
    setPage,
    renderCard,
    toolbarExtra,
    emptyLabel = "No matches.",
    componentId = "directory",
    searchPlaceholder = "Search…",
    renderPager,
  } = props;
  const ui = mergeDirectoryClasses(props.classes);

  return (
    <div class={ui.shell} data-as-component={componentId}>
      <header class={ui.header}>
        <h2 class={ui.title}>{title}</h2>
        {lead ? <p class={ui.lead}>{lead}</p> : null}
      </header>

      <div class={ui.layout}>
        <nav class={ui.nav} aria-label="Directory filters">
          {navGroups.map((group) => (
            <div key={group.id} class={ui.navGroup}>
              <span class={ui.navLabel}>{group.label}</span>
              {group.items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  class={
                    category() === item.id ? ui.navBtnActive : ui.navBtn
                  }
                  aria-pressed={category() === item.id ? "true" : "false"}
                  mix={[
                    on("click", () => {
                      setCategory(item.id);
                      setPage(1);
                    }),
                  ]}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div class={ui.main}>
          <div class={ui.toolbar}>
            <label class={ui.searchWrap}>
              <span class="sr-only">Search</span>
              {MagnifyingGlassIcon({
                class: ui.searchIcon ?? "size-4 shrink-0",
              })}
              <input
                type="search"
                class={ui.search}
                placeholder={searchPlaceholder}
                value={search()}
                mix={[
                  on("input", (e) => {
                    setSearch((e.currentTarget as HTMLInputElement).value);
                    setPage(1);
                  }),
                ]}
              />
            </label>
            {toolbarExtra ? toolbarExtra() : null}
          </div>

          {pageResult().items.length === 0 ? (
            <p class={ui.empty}>{emptyLabel}</p>
          ) : (
            <div class={ui.grid}>
              {pageResult().items.map((entry) => renderCard(entry))}
            </div>
          )}

          {renderPager
            ? renderPager({
                page: pageResult().page,
                totalPages: pageResult().totalPages,
                total: pageResult().total,
                hasPrev: pageResult().hasPrev,
                hasNext: pageResult().hasNext,
                setPage,
              })
            : (
            <div class={ui.pager}>
              <span class={ui.pagerMeta}>
                {pageResult().total === 0
                  ? "0 results"
                  : `Page ${pageResult().page} of ${pageResult().totalPages} · ${pageResult().total} total`}
              </span>
              <div class={ui.pagerActions}>
                <button
                  type="button"
                  class={ui.btn}
                  disabled={!pageResult().hasPrev}
                  mix={[
                    on("click", () =>
                      setPage(Math.max(1, pageResult().page - 1)),
                    ),
                  ]}
                >
                  Previous
                </button>
                <button
                  type="button"
                  class={ui.btn}
                  disabled={!pageResult().hasNext}
                  mix={[on("click", () => setPage(pageResult().page + 1))]}
                >
                  Next
                </button>
              </div>
            </div>
              )}
        </div>
      </div>
    </div>
  );
}
