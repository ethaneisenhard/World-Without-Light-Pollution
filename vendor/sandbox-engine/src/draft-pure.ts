/**
 * Sandbox inspector draft — shared across Sandbox + Permutations views.
 * Props = knobs · slotText = plain-text slot content · children = free-form text.
 */

export type SandboxInspectorDraft = {
  props: Record<string, string>;
  /** Plain text for slots (wrapped to content at render). */
  slotText: Record<string, string>;
  children: string;
};

/** @deprecated Prefer SandboxInspectorDraft */
export type DesignInspectorDraft = SandboxInspectorDraft;

export function mergeDraft(
  base: SandboxInspectorDraft,
  patch: Partial<SandboxInspectorDraft>,
): SandboxInspectorDraft {
  return {
    props: { ...base.props, ...(patch.props ?? {}) },
    slotText: { ...base.slotText, ...(patch.slotText ?? {}) },
    children: patch.children ?? base.children,
  };
}

export function applyPropOverrides(
  draft: SandboxInspectorDraft,
  propOverrides: Record<string, string>,
): SandboxInspectorDraft {
  return mergeDraft(draft, {
    props: { ...draft.props, ...propOverrides },
  });
}
