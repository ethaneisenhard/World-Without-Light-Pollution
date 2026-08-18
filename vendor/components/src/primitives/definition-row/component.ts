import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'definition-row', title: 'Definition row', layer: 'primitive', acceptsChildren: false, props: {}, slots: { term: { title: 'Term' }, description: { title: 'Description' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { term: 'Term', description: 'Description' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { term: text.term?.trim() || 'Term', description: text.description?.trim() || 'Description' }; }
export type { DefinitionRowProps, DefinitionRowSlots } from './definition-row.js';
export { DefinitionRow, renderDefinitionRow } from './definition-row.js';
