import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";
import type { SandboxInspectorDraft } from "./draft-pure.js";

export type SandboxMode = "sandbox" | "permutations";

/** Resolved render input after draft → slots/children mapping. */
export type SandboxRenderContext = {
  props: Record<string, string>;
  /** Library-agnostic slot payloads (often HTML strings for SSR). */
  slots: Record<string, unknown>;
  children?: string;
  draft: SandboxInspectorDraft;
};

/**
 * One registered component — library-agnostic core + optional adapters.
 *
 * `renderHtml` powers Worker SSR + inspector POST refresh.
 * `adapters.remix` (optional) mounts remix/ui Handles in a client shell.
 */
export type SandboxComponentModule = {
  meta: DesignComponentMeta;
  /** Default plain-text for slots (inspector). */
  slotTextDefaults?: Record<string, string>;
  /** Convert slot plain text → slot payloads for render. */
  slotsFromText?: (text: Record<string, string>) => Record<string, unknown>;
  /** Default children when `meta.acceptsChildren`. */
  defaultChildren?: string;
  /**
   * Wrap free-form children text for HTML SSR.
   * Default: escaped paragraph.
   */
  wrapChildrenHtml?: (text: string) => string;
  /** SSR / string preview — required for HTML engine path. */
  renderHtml: (ctx: SandboxRenderContext) => string;
  adapters?: {
    /** remix/ui mount — map draft → Handle props. */
    remix?: RemixSandboxAdapter;
  };
};

export type RemixSandboxAdapter = {
  /**
   * remix/ui Handle component.
   * Typed loosely so engine stays optional-peer on remix.
   */
  Component: (handle: unknown) => unknown;
  /** Map inspector draft → component Handle props. */
  mapDraftToProps: (draft: SandboxInspectorDraft) => Record<string, unknown>;
};

export type PermutationSpec = {
  label: string;
  propKey: string;
  value: string;
  draft: SandboxInspectorDraft;
};

export type PermutationCardHtml = PermutationSpec & {
  html: string;
};

export type InspectorBootstrap = {
  id: string;
  title: string;
  layer: DesignComponentMeta["layer"];
  acceptsChildren: boolean;
  props: DesignComponentMeta["props"];
  slots: NonNullable<DesignComponentMeta["slots"]>;
  draft: SandboxInspectorDraft;
};
