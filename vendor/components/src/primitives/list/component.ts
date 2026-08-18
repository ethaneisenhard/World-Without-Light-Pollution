import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'list', title: 'List', layer: 'primitive', acceptsChildren: true, props: { ordered: { type: 'enum', values: ['off', 'on'], default: 'off', title: 'Ordered' }, tone: { type: 'enum', values: ['ink', 'muted'], default: 'ink', title: 'Tone' } }, slots: { items: { title: 'Items', description: 'One item per line' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { items: 'Item one\nItem two' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { items: text.items?.trim() || 'Item one\nItem two' }; }
export type { ListProps, ListSlots } from './list.js';
export { List, renderList } from './list.js';
