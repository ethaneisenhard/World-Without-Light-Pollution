import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = {
  id: "logo",
  title: "Logo",
  layer: "primitive",
  acceptsChildren: false,
  props: {
    size: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "md",
      title: "Size",
    },
    layout: {
      type: "enum",
      values: ["row", "stack"],
      default: "row",
      title: "Layout",
    },
    markVariant: {
      type: "enum",
      values: ["initials", "glass-box-splash", "glass-box-mark", "image"],
      default: "initials",
      title: "Mark",
    },
  },
  slots: {
    mark: { title: "Mark", optional: true },
    wordmark: { title: "Wordmark" },
  },
} as const satisfies DesignComponentMeta;
export const slotTextDefaults = { mark: 'A', wordmark: 'Glass Box Studio' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { mark: text.mark?.trim() || 'A', wordmark: text.wordmark?.trim() || 'Glass Box Studio' }; }
export type { LogoProps, LogoSlots } from './logo.js';
export { Logo, renderLogo } from './logo.js';
