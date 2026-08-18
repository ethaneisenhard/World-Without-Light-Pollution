/** @jsxImportSource remix/ui */
/**
 * Generic remix/ui Sandbox shell — Studio-tokenized chrome (as-sb-*).
 * Project supplies `renderPreview(draft)`.
 */

import { type Handle, on } from "remix/ui";
import type { SandboxRegistry } from "../registry-pure.js";
import type { SandboxInspectorDraft } from "../draft-pure.js";
import type { SandboxMode } from "../types.js";
import { buildDesignBreadcrumbs } from "../html/breadcrumb-pure.js";

export type RemixSandboxShellProps = {
  registry: SandboxRegistry;
  componentId: string;
  mode?: SandboxMode;
  componentsBasePath?: string;
  /** Studio Nav file path for this component (breadcrumb sync). */
  componentNavPath?: string;
  onModeChange?: (mode: SandboxMode) => void;
  renderPreview: (draft: SandboxInspectorDraft) => unknown;
};

function DesignBreadcrumb(props: {
  crumbs: ReturnType<typeof buildDesignBreadcrumbs>;
}) {
  const { crumbs } = props;
  return (
    <nav class="as-design-bc" aria-label="Design">
      {crumbs.map((c, i) => {
        const current = i === crumbs.length - 1 || !c.href;
        return (
          <>
            {i > 0 ? (
              <span class="as-design-bc__sep" aria-hidden="true">
                /
              </span>
            ) : null}
            {current ? (
              <span
                class="as-design-bc__item as-design-bc__item--current"
                aria-current="page"
              >
                {c.label}
              </span>
            ) : (
              <a
                class="as-design-bc__item as-design-bc__link"
                href={c.href}
                data-as-design-nav={c.navPath}
                data-as-design-site={c.sitePath}
                mix={[
                  on("click", (e) => {
                    e.preventDefault();
                    try {
                      if (window.parent && window.parent !== window) {
                        window.parent.postMessage(
                          {
                            type: "as-design-nav/1",
                            action: "open",
                            path: c.navPath,
                            sitePath: c.sitePath,
                            href: c.href,
                          },
                          "*",
                        );
                      } else if (c.href) {
                        window.location.href = c.href;
                      }
                    } catch {
                      if (c.href) window.location.href = c.href;
                    }
                  }),
                ]}
              >
                {c.label}
              </a>
            )}
          </>
        );
      })}
    </nav>
  );
}

export function RemixSandboxShell(handle: Handle<RemixSandboxShellProps>) {
  return () => {
    const {
      registry,
      componentId,
      mode = "sandbox",
      componentsBasePath = "/__as/design/components",
      componentNavPath,
      onModeChange,
      renderPreview,
    } = handle.props;

    const base = componentsBasePath.replace(/\/$/, "");
    const meta = registry.getMeta(componentId);
    if (!meta) {
      return (
        <main class="as-sb as-sb-page">
          <p>Unknown component: {componentId}</p>
        </main>
      );
    }

    const draft = registry.createDefaultDraft(componentId);
    if (!draft) {
      return (
        <main class="as-sb as-sb-page">
          <p>No draft for: {componentId}</p>
        </main>
      );
    }

    const specs = registry.buildPermutationSpecs(componentId, draft) ?? [];
    const crumbs = buildDesignBreadcrumbs("component", {
      label: meta.title,
      href: `${base}/${componentId}?mode=sandbox`,
      navPath: componentNavPath,
      sitePath: `${base}/${componentId}`,
    });

    function setMode(next: SandboxMode) {
      if (onModeChange) {
        onModeChange(next);
        return;
      }
      window.history.pushState({}, "", `${base}/${componentId}?mode=${next}`);
      handle.update();
    }

    return (
      <div class="as-sb as-sb-root" data-as-sandbox-engine="remix">
        <header class="as-sb-topbar">
          <div class="as-sb-topbar__meta">
            <DesignBreadcrumb crumbs={crumbs} />
            <h1 class="as-sb-topbar__title">{meta.title}</h1>
          </div>
          <nav class="as-sb-mode" role="tablist" aria-label="Preview mode">
            <a
              role="tab"
              aria-selected={mode === "sandbox"}
              class="as-sb-mode__tab"
              href={`${base}/${componentId}?mode=sandbox`}
              mix={[
                on("click", (e) => {
                  e.preventDefault();
                  setMode("sandbox");
                }),
              ]}
            >
              Sandbox
            </a>
            <a
              role="tab"
              aria-selected={mode === "permutations"}
              class="as-sb-mode__tab"
              href={`${base}/${componentId}?mode=permutations`}
              mix={[
                on("click", (e) => {
                  e.preventDefault();
                  setMode("permutations");
                }),
              ]}
            >
              All permutations
            </a>
          </nav>
        </header>

        <div
          class="as-sb-body"
          data-as-studio-layout
          data-as-component-id={componentId}
          data-as-mode={mode}
        >
          <div class="as-sb-canvas" data-as-preview>
            <div class="as-sb-canvas__inner" data-as-preview-body>
              {mode === "sandbox" ? (
                <article class="as-sb-card" data-as-sandbox>
                  <div class="as-sb-card__label">
                    <span>Preview</span>
                    <span class="as-sb-card__label-mono">{meta.id}</span>
                  </div>
                  <div class="as-sb-stage" data-as-stage>
                    {renderPreview(draft) as never}
                  </div>
                </article>
              ) : (
                specs.map((card) => (
                  <article
                    class="as-sb-card"
                    data-as-permutation={`${card.propKey}:${card.value}`}
                  >
                    <div class="as-sb-card__label">
                      <span>{card.label}</span>
                    </div>
                    <div class="as-sb-stage" data-as-stage>
                      {renderPreview(card.draft) as never}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
          <aside class="as-sb-inspector" aria-label="Component inspector">
            <header class="as-sb-inspector__header">
              <div>
                <p class="as-sb-inspector__eyebrow">Inspector</p>
                <h2 class="as-sb-inspector__title">{meta.title}</h2>
              </div>
            </header>
            <p class="as-sb-inspector__lead">
              Live prop / slot editing uses the Worker SSR Sandbox. This remix
              shell mounts the component preview.
            </p>
          </aside>
        </div>
      </div>
    );
  };
}
