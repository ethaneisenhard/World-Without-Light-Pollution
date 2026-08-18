import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'blockquote', title: 'Blockquote', layer: 'primitive', acceptsChildren: false, props: { align: { type: 'enum', values: ['left', 'center'], default: 'left', title: 'Align' } }, slots: { quote: { title: 'Quote' }, cite: { title: 'Cite', optional: true } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { quote: 'Quote', cite: 'Citation' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { quote: text.quote?.trim() || 'Quote', cite: text.cite?.trim() || 'Citation' }; }
export type { BlockquoteProps, BlockquoteSlots } from './blockquote.js';
export { Blockquote, renderBlockquote } from './blockquote.js';
