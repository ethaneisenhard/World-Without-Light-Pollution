import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'link', title: 'Link', layer: 'primitive', acceptsChildren: false, props: { variant: { type: 'enum', values: ['inline', 'subtle', 'button'], default: 'inline', title: 'Variant' }, external: { type: 'enum', values: ['off', 'on'], default: 'off', title: 'External' } }, slots: { label: { title: 'Label' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { label: 'Link' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { label: text.label?.trim() || 'Link' }; }
export type { LinkProps, LinkSlots } from './link.js';
export { Link, renderLink } from './link.js';
