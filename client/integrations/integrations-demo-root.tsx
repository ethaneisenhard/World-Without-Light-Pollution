/** @jsxImportSource remix/ui */
/**
 * Starter Integrations directory demo — same `@glassbox-studio/components/directory` as Studio.
 * State via URL (?cat=&q=&page=) — shareable, Remix-friendly.
 */

import { type Handle, on } from "remix/ui";
import {
  directoryHeroIcon,
  filterDirectoryByCategory,
  filterDirectoryByQuery,
  paginateDirectory,
  renderDirectory,
  type DirectoryNavGroup,
} from "@glassbox-studio/components/directory";
import {
  starterDirectoryBadgeClass,
  starterDirectoryCardClass,
  starterDirectoryCardIconClass,
  starterDirectoryClasses,
} from "./starter-directory-classes.ts";

export const INTEGRATIONS_DEMO_ENTRY_ID = "integrations-demo#IntegrationsDemoRoot";

type DemoEntry = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  popular?: boolean;
};

const NAV: readonly DirectoryNavGroup[] = [
  {
    id: "explore",
    label: "Explore",
    items: [
      { id: "popular", label: "Most popular" },
      { id: "all", label: "All" },
    ],
  },
  {
    id: "categories",
    label: "Categories",
    items: [
      { id: "automation", label: "Automation" },
      { id: "cms", label: "CMS" },
      { id: "crm", label: "CRM" },
      { id: "marketing", label: "Marketing" },
      { id: "messaging", label: "Messaging" },
      { id: "other", label: "Other" },
    ],
  },
];

const CATALOG: readonly DemoEntry[] = [
  {
    id: "n8n",
    title: "n8n",
    description: "Workflow automation for your agent and site backends.",
    category: "automation",
    icon: "bolt",
    popular: true,
  },
  {
    id: "zapier",
    title: "Zapier",
    description: "Easy automation for busy people.",
    category: "automation",
    icon: "bolt",
    popular: true,
  },
  {
    id: "sanity",
    title: "Sanity",
    description: "Headless CMS content for marketing pages.",
    category: "cms",
    icon: "folder",
    popular: true,
  },
  {
    id: "hubspot",
    title: "HubSpot",
    description: "CRM contacts and deal pipelines.",
    category: "crm",
    icon: "circle-stack",
  },
  {
    id: "mailchimp",
    title: "Mailchimp",
    description: "Email campaigns and audiences.",
    category: "marketing",
    icon: "chat",
    popular: true,
  },
  {
    id: "slack",
    title: "Slack",
    description: "Team messaging and channel alerts.",
    category: "messaging",
    icon: "chat",
    popular: true,
  },
  {
    id: "intercom",
    title: "Intercom",
    description: "Customer messaging and support inbox.",
    category: "messaging",
    icon: "chat",
  },
  {
    id: "stripe",
    title: "Stripe",
    description: "Payments and billing for products.",
    category: "other",
    icon: "cloud",
    popular: true,
  },
  {
    id: "airtable",
    title: "Airtable",
    description: "Flexible databases for ops and content.",
    category: "other",
    icon: "circle-stack",
  },
  {
    id: "webflow",
    title: "Webflow",
    description: "Visual CMS and site publishing.",
    category: "cms",
    icon: "globe",
  },
  {
    id: "salesforce",
    title: "Salesforce",
    description: "Enterprise CRM and automation.",
    category: "crm",
    icon: "server",
  },
  {
    id: "segment",
    title: "Segment",
    description: "Customer data pipeline for analytics.",
    category: "marketing",
    icon: "cog",
  },
];

function readParams() {
  const sp = new URLSearchParams(window.location.search);
  return {
    cat: sp.get("cat") || "popular",
    q: sp.get("q") || "",
    page: Math.max(1, Number(sp.get("page") || "1") || 1),
  };
}

function writeParams(next: { cat?: string; q?: string; page?: number }) {
  const sp = new URLSearchParams(window.location.search);
  if (next.cat !== undefined) sp.set("cat", next.cat);
  if (next.q !== undefined) {
    if (next.q.trim()) sp.set("q", next.q);
    else sp.delete("q");
  }
  if (next.page !== undefined) {
    if (next.page <= 1) sp.delete("page");
    else sp.set("page", String(next.page));
  }
  const url = `${window.location.pathname}?${sp.toString()}`.replace(/\?$/, "");
  window.history.replaceState({}, "", url);
}

export function IntegrationsDemoRoot(handle: Handle) {
  return () => {
    const params = readParams();

    const matchCat = (entry: DemoEntry, cat: string) => {
      if (cat === "all") return true;
      if (cat === "popular") return entry.popular === true;
      return entry.category === cat;
    };

    const filtered = filterDirectoryByQuery(
      filterDirectoryByCategory(CATALOG, params.cat, matchCat),
      params.q,
      (e) => [e.title, e.description, e.category],
    );
    const pageResult = () => paginateDirectory(filtered, params.page, 9);

    return (
      <main class="min-h-screen bg-paper px-4 py-10 text-ink md:px-8">
        <div class="mx-auto max-w-6xl">
          {renderDirectory({
            on,
            title: "Connect to third-party apps",
            lead: "Same headless directory as Studio Integrations — this project styles it with @theme tokens (paper / ink / accent).",
            navGroups: NAV,
            category: () => params.cat,
            setCategory: (id) => {
              writeParams({ cat: id, page: 1 });
              handle.update();
            },
            search: () => params.q,
            setSearch: (q) => {
              writeParams({ q, page: 1 });
              handle.update();
            },
            pageResult,
            setPage: (page) => {
              writeParams({ page });
              handle.update();
            },
            classes: starterDirectoryClasses,
            componentId: "integrations-directory",
            searchPlaceholder: "Search integrations…",
            emptyLabel: "No integrations match this filter.",
            renderCard: (entry: DemoEntry) => (
              <article
                key={entry.id}
                class={starterDirectoryCardClass}
                data-integration-id={entry.id}
              >
                <div class="flex items-start gap-3">
                  <span class={starterDirectoryCardIconClass} aria-hidden="true">
                    {directoryHeroIcon(entry.icon)}
                  </span>
                  <div class="min-w-0 flex-1">
                    <h3 class="m-0 text-sm font-semibold text-ink">
                      {entry.title}
                    </h3>
                    <p class="m-0 mt-1 line-clamp-2 text-xs leading-snug text-ink-soft">
                      {entry.description}
                    </p>
                  </div>
                </div>
                <div class="mt-auto flex flex-wrap gap-1.5 pt-1">
                  <span class={starterDirectoryBadgeClass}>{entry.category}</span>
                  {entry.popular ? (
                    <span class={starterDirectoryBadgeClass}>Popular</span>
                  ) : null}
                </div>
              </article>
            ),
          })}
        </div>
      </main>
    );
  };
}
