import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'icon', title: 'Icon', layer: 'primitive', acceptsChildren: false, props: { name: { type: 'enum', values: ['arrow', 'check', 'close', 'dot', 'search'], default: 'dot', title: 'Name' }, size: { type: 'enum', values: ['xs', 'sm', 'md'], default: 'sm', title: 'Size' }, tone: { type: 'enum', values: ['ink', 'muted', 'accent'], default: 'muted', title: 'Tone' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = {} as const;
export function slotsFromPlainText(): Record<string, string> { return {}; }
export type { IconProps, IconSlots } from './icon.js';
export { Icon, renderIcon } from './icon.js';
