/**
 * Canvas Inspector DOM attr contract — ADR-0002.
 * Pure: no DOM / fetch. Parse attr maps ↔ InspectTarget / messages.
 */

import type { InspectorMetaBoot } from "./meta-boot-pure.js";

/** Authoring attrs — stripped in prod by default. */
export const AS_ATTR = {
  inspect: "data-as-inspect",
  kind: "data-as-kind",
  component: "data-as-component",
  slot: "data-as-slot",
  prop: "data-as-prop",
  instance: "data-as-instance",
  source: "data-as-source",
} as const;

export type AsAttrName = (typeof AS_ATTR)[keyof typeof AS_ATTR];

/** Attrs removed when `canvasInspector.stripAttrs` is default/true. */
export const AUTHORING_ATTRS: readonly AsAttrName[] = [
  AS_ATTR.inspect,
  AS_ATTR.kind,
  AS_ATTR.instance,
  AS_ATTR.source,
  AS_ATTR.prop,
] as const;

export const INSPECT_KINDS = [
  "component",
  "slot",
  "prop",
  "markdown",
  "text",
] as const;

export type InspectKind = (typeof INSPECT_KINDS)[number];

export type InspectTarget = {
  kind: InspectKind;
  componentId?: string;
  slot?: string;
  prop?: string;
  instanceId?: string;
  source?: string;
};

export type AttrMap = Readonly<Record<string, string | null | undefined>>;

export const CANVAS_INSPECTOR_PROTOCOL = "as-canvas-inspector/1" as const;

export type CanvasInspectorHostToGuest =
  | { protocol: typeof CANVAS_INSPECTOR_PROTOCOL; type: "inspect-on" }
  | { protocol: typeof CANVAS_INSPECTOR_PROTOCOL; type: "inspect-off" }
  | {
      protocol: typeof CANVAS_INSPECTOR_PROTOCOL;
      type: "reveal-all";
      on: boolean;
    }
  | {
      protocol: typeof CANVAS_INSPECTOR_PROTOCOL;
      type: "labels-on";
      on: boolean;
    }
  | {
      protocol: typeof CANVAS_INSPECTOR_PROTOCOL;
      type: "set-mode";
      mode: "select" | "browse";
    }
  | {
      protocol: typeof CANVAS_INSPECTOR_PROTOCOL;
      type: "select-target";
      target: InspectTarget | null;
      /** Host echo to sibling iframes — guest must not re-post select. */
      silent?: boolean;
    }
  | {
      protocol: typeof CANVAS_INSPECTOR_PROTOCOL;
      type: "apply-draft";
      instanceId?: string;
      componentId: string;
      props?: Record<string, string>;
      slotText?: Record<string, string>;
      /**
       * `slots` (default) — patch live DOM text, keep classes.
       * `full` — sandbox re-render (prop / structure changes).
       */
      patch?: "slots" | "full";
    };

export type CanvasInspectorGuestToHost =
  | {
      protocol: typeof CANVAS_INSPECTOR_PROTOCOL;
      type: "ready";
    }
  | {
      protocol: typeof CANVAS_INSPECTOR_PROTOCOL;
      type: "select";
      target: InspectTarget | null;
      /** Outer → inner component roots (section → container → …). */
      ancestors?: InspectTarget[];
      /** Registry boot + live slot seed — same-origin from guest; Studio must not re-fetch. */
      meta?: InspectorMetaBoot | null;
    }
  | {
      protocol: typeof CANVAS_INSPECTOR_PROTOCOL;
      type: "hover";
      target: InspectTarget | null;
    }
  | {
      protocol: typeof CANVAS_INSPECTOR_PROTOCOL;
      type: "text-change";
      target: InspectTarget | null;
      text: string;
    };

export function isInspectKind(value: string | null | undefined): value is InspectKind {
  return (
    value != null &&
    (INSPECT_KINDS as readonly string[]).includes(value)
  );
}

function nonempty(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

/** Infer kind when `data-as-kind` missing but other attrs present. */
export function inferInspectKind(attrs: AttrMap): InspectKind | null {
  const explicit = nonempty(attrs[AS_ATTR.kind]);
  if (isInspectKind(explicit)) return explicit;
  if (nonempty(attrs[AS_ATTR.prop])) return "prop";
  if (nonempty(attrs[AS_ATTR.slot])) return "slot";
  if (nonempty(attrs[AS_ATTR.component])) return "component";
  if (nonempty(attrs[AS_ATTR.source])) return "text";
  if (nonempty(attrs[AS_ATTR.inspect]) === "1" || nonempty(attrs[AS_ATTR.inspect]) === "true") {
    return "text";
  }
  return null;
}

/** Parse a flat attr map (from element.getAttribute or HTML tokeniser) → target. */
export function parseInspectTarget(attrs: AttrMap): InspectTarget | null {
  const kind = inferInspectKind(attrs);
  if (!kind) return null;

  const inspectFlag = nonempty(attrs[AS_ATTR.inspect]);
  const componentId = nonempty(attrs[AS_ATTR.component]);
  const slot = nonempty(attrs[AS_ATTR.slot]);
  const prop = nonempty(attrs[AS_ATTR.prop]);
  const instanceId = nonempty(attrs[AS_ATTR.instance]);
  const source = nonempty(attrs[AS_ATTR.source]);

  const optedIn =
    inspectFlag === "1" ||
    inspectFlag === "true" ||
    componentId != null ||
    slot != null ||
    prop != null ||
    source != null;
  if (!optedIn) return null;

  const target: InspectTarget = { kind };
  if (componentId) target.componentId = componentId;
  if (slot) target.slot = slot;
  if (prop) target.prop = prop;
  if (instanceId) target.instanceId = instanceId;
  if (source) target.source = source;
  return target;
}

/** Serialize target → attr map for emit helpers / tests. */
export function serializeInspectAttrs(target: InspectTarget): Record<AsAttrName, string> {
  const out: Partial<Record<AsAttrName, string>> = {
    [AS_ATTR.inspect]: "1",
    [AS_ATTR.kind]: target.kind,
  };
  if (target.componentId) out[AS_ATTR.component] = target.componentId;
  if (target.slot) out[AS_ATTR.slot] = target.slot;
  if (target.prop) out[AS_ATTR.prop] = target.prop;
  if (target.instanceId) out[AS_ATTR.instance] = target.instanceId;
  if (target.source) out[AS_ATTR.source] = target.source;
  return out as Record<AsAttrName, string>;
}

/** Selection / hover payload for postMessage (stable JSON shape). */
export function serializeSelectPayload(
  target: InspectTarget | null,
  ancestors?: InspectTarget[],
): Extract<CanvasInspectorGuestToHost, { type: "select" }> {
  const msg: Extract<CanvasInspectorGuestToHost, { type: "select" }> = {
    protocol: CANVAS_INSPECTOR_PROTOCOL,
    type: "select",
    target,
  };
  if (ancestors && ancestors.length > 0) msg.ancestors = ancestors;
  return msg;
}

export function isCanvasInspectorMessage(
  data: unknown,
): data is CanvasInspectorHostToGuest | CanvasInspectorGuestToHost {
  if (data == null || typeof data !== "object") return false;
  const d = data as { protocol?: unknown; type?: unknown };
  return d.protocol === CANVAS_INSPECTOR_PROTOCOL && typeof d.type === "string";
}

/** Strip authoring attrs from an attr map (pure; HTML transform uses this). */
export function stripAuthoringAttrs(
  attrs: AttrMap,
  options: { strip: boolean; alsoStripComponentSlot?: boolean } = { strip: true },
): Record<string, string> {
  if (!options.strip) {
    const keep: Record<string, string> = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (v != null && v !== "") keep[k] = v;
    }
    return keep;
  }
  const drop = new Set<string>(AUTHORING_ATTRS);
  if (options.alsoStripComponentSlot) {
    drop.add(AS_ATTR.component);
    drop.add(AS_ATTR.slot);
  }
  const keep: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === "") continue;
    if (drop.has(k)) continue;
    keep[k] = v;
  }
  return keep;
}

/** Regex strip of authoring attrs from an HTML string (SSR / static). */
export function stripAuthoringAttrsFromHtml(
  html: string,
  options: { strip: boolean; alsoStripComponentSlot?: boolean } = { strip: true },
): string {
  if (!options.strip) return html;
  const names = options.alsoStripComponentSlot
    ? [...AUTHORING_ATTRS, AS_ATTR.component, AS_ATTR.slot]
    : [...AUTHORING_ATTRS];
  let out = html;
  for (const name of names) {
    const re = new RegExp(
      `\\s${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=(?:"[^"]*"|'[^']*'|[^\\s>]+)`,
      "gi",
    );
    out = out.replace(re, "");
  }
  return out;
}

export function resolveStripAttrsFlag(
  canvasInspector: { stripAttrs?: boolean } | null | undefined,
): boolean {
  if (canvasInspector == null) return true;
  if (canvasInspector.stripAttrs === false) return false;
  return true;
}
