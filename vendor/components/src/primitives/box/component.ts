import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';

export const meta = {
  id: 'box',
  title: 'Box',
  layer: 'primitive',
  acceptsChildren: true,
  props: {
    tone: { type: 'enum', values: ['transparent', 'surface', 'muted', 'brand'], default: 'transparent', title: 'Tone' },
    padding: { type: 'enum', values: ['none', 'sm', 'md', 'lg'], default: 'md', title: 'Padding' },
    radius: { type: 'enum', values: ['none', 'md', 'lg', 'xl'], default: 'lg', title: 'Radius' },
  },
} as const satisfies DesignComponentMeta;

export const slotTextDefaults = {} as const;
export function slotsFromPlainText(): Record<string, string> { return {}; }
export type { BoxProps, BoxSlots } from './box.js';
export { Box, renderBox } from './box.js';
