import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'card', title: 'Card', layer: 'primitive', acceptsChildren: true, props: { tone: { type: 'enum', values: ['surface', 'muted', 'brand'], default: 'surface', title: 'Tone' }, padding: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', title: 'Padding' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = {} as const;
export function slotsFromPlainText(): Record<string, string> { return {}; }
export type { CardProps, CardSlots } from './card.js';
export { Card, renderCard } from './card.js';
