import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'pill', title: 'Pill', layer: 'primitive', acceptsChildren: false, props: { tone: { type: 'enum', values: ['neutral', 'accent', 'muted'], default: 'neutral', title: 'Tone' } }, slots: { label: { title: 'Label' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { label: 'Pill' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { label: text.label?.trim() || 'Pill' }; }
export type { PillProps, PillSlots } from './pill.js';
export { Pill, renderPill } from './pill.js';
