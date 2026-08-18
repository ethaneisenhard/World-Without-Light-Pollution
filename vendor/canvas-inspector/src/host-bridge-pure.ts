/**
 * Host ↔ guest message builders (pure).
 */

import {
  CANVAS_INSPECTOR_PROTOCOL,
  type CanvasInspectorHostToGuest,
  type InspectTarget,
} from "./attr-contract-pure.js";

export function inspectOnMessage(): CanvasInspectorHostToGuest {
  return { protocol: CANVAS_INSPECTOR_PROTOCOL, type: "inspect-on" };
}

export function inspectOffMessage(): CanvasInspectorHostToGuest {
  return { protocol: CANVAS_INSPECTOR_PROTOCOL, type: "inspect-off" };
}

export function applyDraftMessage(input: {
  componentId: string;
  instanceId?: string;
  props?: Record<string, string>;
  slotText?: Record<string, string>;
  patch?: "slots" | "full";
}): CanvasInspectorHostToGuest {
  return {
    protocol: CANVAS_INSPECTOR_PROTOCOL,
    type: "apply-draft",
    componentId: input.componentId,
    instanceId: input.instanceId,
    props: input.props,
    slotText: input.slotText,
    ...(input.patch ? { patch: input.patch } : {}),
  };
}

export function revealAllMessage(on: boolean): CanvasInspectorHostToGuest {
  return { protocol: CANVAS_INSPECTOR_PROTOCOL, type: "reveal-all", on };
}

export function labelsOnMessage(on: boolean): CanvasInspectorHostToGuest {
  return { protocol: CANVAS_INSPECTOR_PROTOCOL, type: "labels-on", on };
}

export function setModeMessage(
  mode: "select" | "browse",
): CanvasInspectorHostToGuest {
  return { protocol: CANVAS_INSPECTOR_PROTOCOL, type: "set-mode", mode };
}

export function selectTargetMessage(
  target: InspectTarget | null,
  opts?: { silent?: boolean },
): CanvasInspectorHostToGuest {
  return {
    protocol: CANVAS_INSPECTOR_PROTOCOL,
    type: "select-target",
    target,
    ...(opts?.silent ? { silent: true } : {}),
  };
}

/** Short label for Studio chrome when a target is selected. */
export function inspectTargetLabel(target: InspectTarget | null): string {
  if (!target) return "Nothing selected";
  const parts: string[] = [target.kind];
  if (target.componentId) parts.push(target.componentId);
  if (target.slot) parts.push(`slot:${target.slot}`);
  if (target.prop) parts.push(`prop:${target.prop}`);
  if (target.instanceId) parts.push(`#${target.instanceId}`);
  return parts.join(" · ");
}
