import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'divider', title: 'Divider', layer: 'primitive', acceptsChildren: false, props: { orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', title: 'Orientation' }, tone: { type: 'enum', values: ['subtle', 'strong'], default: 'subtle', title: 'Tone' }, inset: { type: 'enum', values: ['none', 'sm', 'md'], default: 'none', title: 'Inset' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = {} as const;
export function slotsFromPlainText(): Record<string, string> { return {}; }
export type { DividerProps, DividerSlots } from './divider.js';
export { Divider, renderDivider } from './divider.js';
