/** @jsxImportSource remix/ui */
import { type Handle, on } from "remix/ui";
import { RemixSandboxShell } from "@glassbox-studio/sandbox-engine/remix";
import { renderRemixPreview } from "./remix-adapters.tsx";
import {
  designSandboxRegistry,
  listDesignComponents,
  type DesignComponentId,
} from "../../src/design/registry.ts";

export const DESIGN_SANDBOX_ENTRY_ID = "design-sandbox#DesignSandboxRoot";

type SandboxMode = "sandbox" | "permutations";

function parseRoute(): {
  kind: "home" | "index" | "system" | "component";
  id?: string;
  mode: SandboxMode;
} {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const mode =
    new URLSearchParams(window.location.search).get("mode") === "permutations"
      ? "permutations"
      : "sandbox";
  if (path === "/__as/design") return { kind: "home", mode };
  if (path === "/__as/design/system") return { kind: "system", mode };
  if (path === "/__as/design/components") return { kind: "index", mode };
  const m = path.match(/^\/__as\/design\/components\/([^/]+)$/);
  if (m?.[1]) return { kind: "component", id: m[1], mode };
  return { kind: "index", mode };
}

function layerLabel(layer: string): string {
  const l = layer.toLowerCase();
  if (l === "primitive") return "Primitive";
  if (l === "composite") return "Composite";
  return l ? l[0]!.toUpperCase() + l.slice(1) : "Component";
}

function catalogLayers(
  all: readonly { layer: string }[],
): string[] {
  const prefer = ["primitive", "composite"];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of prefer) {
    if (all.some((c) => String(c.layer).toLowerCase() === p)) {
      seen.add(p);
      out.push(p);
    }
  }
  for (const c of all) {
    const l = String(c.layer).toLowerCase();
    if (!seen.has(l)) {
      seen.add(l);
      out.push(l);
    }
  }
  return out;
}

export function DesignSandboxRoot(handle: Handle) {
  let catalogLayer = "all";
  let catalogQuery = "";

  return () => {
    const route = parseRoute();

    if (route.kind === "home") {
      if (typeof window !== "undefined") {
        window.location.replace("/__as/design?ssr=1");
      }
      return (
        <main class="min-h-screen bg-paper px-6 py-8 text-ink">
          <p class="text-sm text-ink-soft">Loading design home…</p>
        </main>
      );
    }

    if (route.kind === "index") {
      const all = listDesignComponents();
      const layers = catalogLayers(all);
      const filtered = all.filter((c) => {
        const L = String(c.layer).toLowerCase();
        const okLayer = catalogLayer === "all" || L === catalogLayer;
        const hay = `${c.title} ${c.id} ${c.layer}`.toLowerCase();
        const q = catalogQuery.trim().toLowerCase();
        return okLayer && (!q || hay.includes(q));
      });
      const navItems = [
        { id: "all", label: "All" },
        ...layers.map((l) => ({ id: l, label: layerLabel(l) })),
      ];

      return (
        <main class="min-h-screen bg-paper px-4 py-8 text-ink md:px-8">
          <div class="mx-auto flex max-w-6xl flex-col gap-8">
            <header class="flex flex-col gap-3 border-b border-line pb-6">
              <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                Design library
              </p>
              <h1 class="font-display text-3xl font-semibold tracking-tight text-ink">
                Components
              </h1>
              <p class="max-w-[52ch] text-sm leading-relaxed text-ink-soft">
                Browse primitives and composites — open any card for the
                interactive sandbox (props, slots, permutations).
              </p>
              <div class="flex flex-wrap gap-2">
                <span class="inline-flex items-center rounded-full border border-line bg-paper-raised px-2.5 py-1 text-[11px] text-ink-soft">
                  <strong class="mr-1 text-ink">{filtered.length}</strong>
                  shown
                </span>
                {layers.map((l) => {
                  const n = all.filter(
                    (c) => String(c.layer).toLowerCase() === l,
                  ).length;
                  return (
                    <span
                      key={l}
                      class="inline-flex items-center rounded-full border border-line bg-paper-raised px-2.5 py-1 text-[11px] text-ink-soft"
                    >
                      <strong class="mr-1 text-ink">{n}</strong>
                      {layerLabel(l)}
                      {n === 1 ? "" : "s"}
                    </span>
                  );
                })}
              </div>
            </header>

            <div class="flex gap-8 max-md:flex-col">
              <nav
                class="flex w-48 shrink-0 flex-col gap-1.5 max-md:w-full max-md:flex-row max-md:flex-wrap"
                aria-label="Component layers"
              >
                <span class="px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft max-md:w-full">
                  Explore
                </span>
                {navItems.map((item) => {
                  const active = catalogLayer === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      class={
                        active
                          ? "inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-left text-sm font-medium text-ink"
                          : "inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-transparent px-3 py-1.5 text-left text-sm text-ink-soft hover:bg-sand hover:text-ink"
                      }
                      aria-pressed={active ? "true" : "false"}
                      mix={[
                        on("click", () => {
                          catalogLayer = item.id;
                          handle.update();
                        }),
                      ]}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div class="flex flex-1 flex-col gap-4">
                <label class="flex items-center gap-2 rounded-xl border border-line bg-paper-raised px-3 py-2">
                  <span class="sr-only">Search components</span>
                  <input
                    type="search"
                    class="flex-1 border-0 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-soft"
                    placeholder="Search by name or id…"
                    value={catalogQuery}
                    mix={[
                      on("input", (e) => {
                        catalogQuery = (
                          e.currentTarget as HTMLInputElement
                        ).value;
                        handle.update();
                      }),
                    ]}
                  />
                </label>

                {filtered.length === 0 ? (
                  <p class="px-4 py-8 text-center text-sm text-ink-soft">
                    No components match.
                  </p>
                ) : (
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((c) => {
                      const mark = c.title
                        .split(/\s+/)
                        .map((w) => w[0] ?? "")
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      const blurb =
                        String(c.layer).toLowerCase() === "composite"
                          ? `Composite pattern — open the sandbox to tune slots and layout for ${c.title}.`
                          : `Primitive — building block for pages and composites.`;
                      return (
                        <a
                          key={c.id}
                          class="flex gap-3 rounded-xl border border-line bg-paper-raised p-3.5 text-left shadow-sm transition-colors hover:border-accent/40"
                          href={`/__as/design/components/${c.id}?mode=sandbox`}
                        >
                          <span
                            class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-[11px] font-bold tracking-wide text-accent"
                            aria-hidden="true"
                          >
                            {mark || c.id.slice(0, 2).toUpperCase()}
                          </span>
                          <span class="flex flex-1 flex-col gap-1">
                            <span class="flex flex-wrap items-center gap-2">
                              <span class="text-[15px] font-semibold text-ink">
                                {c.title}
                              </span>
                              <span class="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-soft">
                                {layerLabel(String(c.layer))}
                              </span>
                            </span>
                            <span class="font-mono text-[11px] text-ink-soft">
                              {c.id}
                            </span>
                            <span class="text-[12px] leading-snug text-ink-soft">
                              {blurb}
                            </span>
                            <span class="mt-auto pt-2 text-[12px] font-semibold text-accent">
                              Open sandbox
                            </span>
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      );
    }

    if (route.kind === "system") {
      if (typeof window !== "undefined") {
        window.location.replace("/__as/design/system?ssr=1");
      }
      return (
        <main class="min-h-screen bg-paper px-6 py-8 text-ink">
          <p class="text-sm text-ink-soft">Loading token atlas…</p>
        </main>
      );
    }

    const id = route.id as DesignComponentId;

    return (
      <RemixSandboxShell
        registry={designSandboxRegistry}
        componentId={id}
        mode={route.mode}
        renderPreview={(draft) => renderRemixPreview(id, draft)}
        onModeChange={(mode) => {
          window.history.pushState(
            {},
            "",
            `/__as/design/components/${id}?mode=${mode}`,
          );
          handle.update();
        }}
      />
    );
  };
}
