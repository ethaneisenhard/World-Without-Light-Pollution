/**
 * Registry-backed inspector panel model — pure.
 * Local meta shape mirrors DesignComponentMeta (no hard studio-core import).
 */

export type PanelEnumPropDef = {
  type: "enum";
  values: readonly string[];
  default?: string;
  title?: string;
};

export type PanelComponentMeta = {
  id: string;
  title: string;
  props: Record<string, PanelEnumPropDef>;
  slots?: Record<string, { title?: string; optional?: boolean }>;
  acceptsChildren?: boolean;
};

export type PanelPropField = {
  key: string;
  title: string;
  values: readonly string[];
  value: string;
};

export type PanelSlotField = {
  key: string;
  title: string;
  value: string;
  optional?: boolean;
};

export type CanvasInspectorPanelModel = {
  componentId: string;
  title: string;
  props: PanelPropField[];
  slots: PanelSlotField[];
  children?: string;
  acceptsChildren: boolean;
};

export type PanelDraft = {
  props: Record<string, string>;
  slotText: Record<string, string>;
  children: string;
};

export function buildPanelModel(
  meta: PanelComponentMeta,
  draft: PanelDraft,
): CanvasInspectorPanelModel {
  const props: PanelPropField[] = Object.entries(meta.props).map(
    ([key, def]) => ({
      key,
      title: def.title ?? key,
      values: def.values,
      value: draft.props[key] ?? def.default ?? def.values[0] ?? "",
    }),
  );
  const slots: PanelSlotField[] = Object.entries(meta.slots ?? {}).map(
    ([key, def]) => ({
      key,
      title: def.title ?? key,
      value: draft.slotText[key] ?? "",
      optional: def.optional,
    }),
  );
  return {
    componentId: meta.id,
    title: meta.title,
    props,
    slots,
    children: meta.acceptsChildren ? draft.children : undefined,
    acceptsChildren: Boolean(meta.acceptsChildren),
  };
}

export function patchPanelProp(
  draft: PanelDraft,
  key: string,
  value: string,
): PanelDraft {
  return {
    ...draft,
    props: { ...draft.props, [key]: value },
  };
}

export function patchPanelSlot(
  draft: PanelDraft,
  key: string,
  value: string,
): PanelDraft {
  return {
    ...draft,
    slotText: { ...draft.slotText, [key]: value },
  };
}

export function defaultDraftFromMeta(meta: PanelComponentMeta): PanelDraft {
  const props: Record<string, string> = {};
  for (const [key, def] of Object.entries(meta.props)) {
    if (def.default != null) props[key] = def.default;
    else if (def.values[0]) props[key] = def.values[0];
  }
  const slotText: Record<string, string> = {};
  for (const key of Object.keys(meta.slots ?? {})) {
    slotText[key] = "";
  }
  return {
    props,
    slotText,
    children: meta.acceptsChildren ? "" : "",
  };
}
