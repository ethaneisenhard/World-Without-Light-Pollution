import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'cta-band', title: 'CTA band', layer: 'composite', acceptsChildren: false, props: { tone: { type: 'enum', values: ['surface', 'muted', 'brand'], default: 'surface', title: 'Tone' } }, slots: { title: { title: 'Title' }, text: { title: 'Text', optional: true }, ctaPrimary: { title: 'Primary CTA', optional: true }, ctaSecondary: { title: 'Secondary CTA', optional: true } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { title: 'Call to action', text: 'Add a short supporting line.', ctaPrimary: 'Primary action', ctaSecondary: 'Secondary action' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { title: text.title?.trim() || 'Call to action', text: text.text?.trim() || '', ctaPrimary: text.ctaPrimary?.trim() || '', ctaSecondary: text.ctaSecondary?.trim() || '' }; }
export type { CtaBandProps, CtaBandSlots } from './cta-band.js';
export { CtaBand, renderCtaBand } from './cta-band.js';
