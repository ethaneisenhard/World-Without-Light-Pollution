/**
 * Design component contract — BrowserUI-inspired, TypeScript-native.
 *
 * | Field      | Role |
 * | ---------- | ---- |
 * | `props`    | Component-specific knobs (layout, tone, size) — not content |
 * | `slots`    | Named holes for composing primitives / other components |
 * | `children` | Free-form / mapped list content (cards, items) |
 */

export type EnumPropDef = {
  type: "enum";
  values: readonly string[];
  default?: string;
  title?: string;
  description?: string;
};

export type SlotDef = {
  title?: string;
  description?: string;
  /** When true, sandbox may omit the slot. */
  optional?: boolean;
};

export type DesignComponentLayer = "primitive" | "composite" | "pattern";

export type DesignComponentMeta = {
  id: string;
  title: string;
  layer: DesignComponentLayer;
  props: Record<string, EnumPropDef>;
  slots?: Record<string, SlotDef>;
  /** Free-form / mapped children (lists, card grids). */
  acceptsChildren?: boolean;
};

/** Nav / Files leaf for a design component module. */
export const DESIGN_COMPONENT_MODULE = /\/component\.ts$/i;

export function isDesignComponentModulePath(filePath: string): boolean {
  return DESIGN_COMPONENT_MODULE.test(filePath.replace(/^\/+|\/+$/g, ""));
}

/** `design/components/composites/blog-hero/component.ts` → `blog-hero` */
export function designComponentIdFromPath(filePath: string): string | null {
  const normalized = filePath.replace(/^\/+|\/+$/g, "");
  if (!DESIGN_COMPONENT_MODULE.test(normalized)) return null;
  const folder = normalized.replace(/\/component\.ts$/i, "");
  return folder.split("/").pop() ?? null;
}
