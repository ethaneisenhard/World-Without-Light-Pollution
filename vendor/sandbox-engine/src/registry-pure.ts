/**
 * Sandbox registry — pure. Projects register modules; engine owns drafts + permutations.
 */

import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";
import {
  applyPropOverrides,
  type SandboxInspectorDraft,
} from "./draft-pure.js";
import type {
  InspectorBootstrap,
  PermutationCardHtml,
  PermutationSpec,
  SandboxComponentModule,
  SandboxRenderContext,
} from "./types.js";

export type SandboxRegistry = {
  list(): DesignComponentMeta[];
  get(id: string): SandboxComponentModule | null;
  getMeta(id: string): DesignComponentMeta | null;
  createDefaultDraft(id: string): SandboxInspectorDraft | null;
  renderWithDraft(
    id: string,
    draft: SandboxInspectorDraft,
    propOverrides?: Record<string, string>,
  ): string | null;
  buildPermutationSpecs(
    id: string,
    draft?: SandboxInspectorDraft,
  ): PermutationSpec[] | null;
  buildPermutationCards(
    id: string,
    draft?: SandboxInspectorDraft,
  ): PermutationCardHtml[] | null;
  inspectorBootstrap(id: string): InspectorBootstrap | null;
};

function escapePlain(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function defaultWrapChildrenHtml(text: string): string {
  return `<p class="text-ink-soft text-sm px-6">${escapePlain(text || "Content")}</p>`;
}

function defaultPropsFor(mod: SandboxComponentModule): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, def] of Object.entries(mod.meta.props)) {
    if (def.default != null) out[key] = def.default;
  }
  return out;
}

function buildContext(
  mod: SandboxComponentModule,
  draft: SandboxInspectorDraft,
  propOverrides: Record<string, string> = {},
): SandboxRenderContext {
  const props = { ...draft.props, ...propOverrides };
  const slots = (mod.slotsFromText ?? (() => ({})))(draft.slotText);
  const wrap = mod.wrapChildrenHtml ?? defaultWrapChildrenHtml;
  const children = mod.meta.acceptsChildren
    ? wrap(draft.children)
    : undefined;
  return {
    props,
    slots,
    children,
    draft: applyPropOverrides(draft, propOverrides),
  };
}

export function createSandboxRegistry(
  modules: readonly SandboxComponentModule[],
): SandboxRegistry {
  const byId = new Map<string, SandboxComponentModule>();
  for (const mod of modules) {
    if (byId.has(mod.meta.id)) {
      throw new Error(`Duplicate sandbox component id: ${mod.meta.id}`);
    }
    byId.set(mod.meta.id, mod);
  }

  function requireMod(id: string): SandboxComponentModule | null {
    return byId.get(id) ?? null;
  }

  function createDefaultDraft(id: string): SandboxInspectorDraft | null {
    const mod = requireMod(id);
    if (!mod) return null;
    return {
      props: defaultPropsFor(mod),
      slotText: { ...(mod.slotTextDefaults ?? {}) },
      children: mod.meta.acceptsChildren
        ? (mod.defaultChildren ?? "Content")
        : "",
    };
  }

  function renderWithDraft(
    id: string,
    draft: SandboxInspectorDraft,
    propOverrides: Record<string, string> = {},
  ): string | null {
    const mod = requireMod(id);
    if (!mod) return null;
    return mod.renderHtml(buildContext(mod, draft, propOverrides));
  }

  function buildPermutationSpecs(
    id: string,
    draft?: SandboxInspectorDraft,
  ): PermutationSpec[] | null {
    const mod = requireMod(id);
    if (!mod) return null;
    const base = draft ?? createDefaultDraft(id);
    if (!base) return null;

    const enumProps = Object.entries(mod.meta.props).filter(
      ([, def]) => def.type === "enum" && def.values.length > 0,
    );

    if (enumProps.length === 0) {
      return [
        {
          label: "Default",
          propKey: "",
          value: "",
          draft: base,
        },
      ];
    }

    const cards: PermutationSpec[] = [];
    for (const [propKey, def] of enumProps) {
      for (const value of def.values) {
        cards.push({
          label: `${def.title ?? propKey}: ${value}`,
          propKey,
          value,
          draft: applyPropOverrides(base, { [propKey]: value }),
        });
      }
    }
    return cards;
  }

  function buildPermutationCards(
    id: string,
    draft?: SandboxInspectorDraft,
  ): PermutationCardHtml[] | null {
    const specs = buildPermutationSpecs(id, draft);
    if (!specs) return null;
    return specs.map((spec) => ({
      ...spec,
      html: renderWithDraft(id, spec.draft) ?? "",
    }));
  }

  function inspectorBootstrap(id: string): InspectorBootstrap | null {
    const mod = requireMod(id);
    const draft = createDefaultDraft(id);
    if (!mod || !draft) return null;
    return {
      id,
      title: mod.meta.title,
      layer: mod.meta.layer,
      acceptsChildren: Boolean(mod.meta.acceptsChildren),
      props: mod.meta.props,
      slots: mod.meta.slots ?? {},
      draft,
    };
  }

  return {
    list() {
      return [...byId.values()].map((m) => m.meta);
    },
    get: requireMod,
    getMeta(id) {
      return requireMod(id)?.meta ?? null;
    },
    createDefaultDraft,
    renderWithDraft,
    buildPermutationSpecs,
    buildPermutationCards,
    inspectorBootstrap,
  };
}
