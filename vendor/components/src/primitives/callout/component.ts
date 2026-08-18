import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'callout', title: 'Callout', layer: 'primitive', acceptsChildren: false, props: { tone: { type: 'enum', values: ['info', 'success', 'warning'], default: 'info', title: 'Tone' } }, slots: { title: { title: 'Title', optional: true }, content: { title: 'Content' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { title: 'Callout', content: 'Callout content' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { title: text.title?.trim() || 'Callout', content: text.content?.trim() || 'Callout content' }; }
export type { CalloutProps, CalloutSlots } from './callout.js';
export { Callout, renderCallout } from './callout.js';
