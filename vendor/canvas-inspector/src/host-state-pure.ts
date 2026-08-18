/**
 * Pure helpers for host connector (no DOM).
 */

import {
  isCanvasInspectorMessage,
  type CanvasInspectorGuestToHost,
  type InspectTarget,
} from "./attr-contract-pure.js";
import { inspectOffMessage, inspectOnMessage } from "./host-bridge-pure.js";
import type { InspectorMetaBoot } from "./meta-boot-pure.js";

export type CanvasInspectorHostState = {
  inspectOn: boolean;
  selected: InspectTarget | null;
  hover: InspectTarget | null;
  /** Outer → inner stamped components for panel trail. */
  ancestors: InspectTarget[];
  /** Last meta from guest select (DOM-library path — no Studio cross-origin fetch). */
  meta: InspectorMetaBoot | null;
};

export function initialCanvasInspectorHostState(): CanvasInspectorHostState {
  return {
    inspectOn: false,
    selected: null,
    hover: null,
    ancestors: [],
    meta: null,
  };
}

/**
 * Patch meta.draft.slotText from a canvas inline edit.
 * No-op when target has no slot or meta is missing.
 */
export function applyTextChangeToHostState(
  state: CanvasInspectorHostState,
  target: InspectTarget | null,
  text: string,
): CanvasInspectorHostState {
  const slot = target?.slot?.trim();
  if (!slot || !state.meta) return state;
  const draft = state.meta.draft ?? {
    props: {},
    slotText: {},
    children: "",
  };
  if (draft.slotText[slot] === text) return state;
  return {
    ...state,
    meta: {
      ...state.meta,
      draft: {
        ...draft,
        slotText: { ...draft.slotText, [slot]: text },
      },
    },
  };
}

export function reduceCanvasInspectorHostMessage(
  state: CanvasInspectorHostState,
  data: unknown,
): CanvasInspectorHostState {
  if (!isCanvasInspectorMessage(data)) return state;
  const msg = data as CanvasInspectorGuestToHost;
  if (msg.type === "select") {
    return {
      ...state,
      selected: msg.target,
      ancestors: msg.target ? (msg.ancestors ?? []) : [],
      meta: msg.target ? (msg.meta ?? null) : null,
    };
  }
  if (msg.type === "hover") {
    return { ...state, hover: msg.target };
  }
  if (msg.type === "text-change") {
    return applyTextChangeToHostState(state, msg.target, msg.text);
  }
  return state;
}

export function toggleInspectOn(
  state: CanvasInspectorHostState,
): {
  state: CanvasInspectorHostState;
  message:
    | ReturnType<typeof inspectOnMessage>
    | ReturnType<typeof inspectOffMessage>;
} {
  const next = !state.inspectOn;
  return {
    state: {
      inspectOn: next,
      selected: next ? state.selected : null,
      hover: next ? state.hover : null,
      ancestors: next ? state.ancestors : [],
      meta: next ? state.meta : null,
    },
    message: next ? inspectOnMessage() : inspectOffMessage(),
  };
}
