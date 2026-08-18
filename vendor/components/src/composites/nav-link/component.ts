import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'nav-link', title: 'Nav link', layer: 'composite', acceptsChildren: false, props: { current: { type: 'enum', values: ['off', 'on'], default: 'off', title: 'Current' } }, slots: { label: { title: 'Label' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { label: 'Link' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { label: text.label?.trim() || 'Link' }; }
export type { NavLinkProps, NavLinkSlots } from './nav-link.js';
export { NavLink, renderNavLink } from './nav-link.js';
