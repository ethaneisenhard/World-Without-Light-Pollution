import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'input', title: 'Input', layer: 'primitive', acceptsChildren: false, props: { type: { type: 'enum', values: ['text', 'email', 'password', 'search'], default: 'text', title: 'Type' }, invalid: { type: 'enum', values: ['off', 'on'], default: 'off', title: 'Invalid' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = {} as const;
export function slotsFromPlainText(): Record<string, string> { return {}; }
export type { InputProps, InputSlots } from './input.js';
export { Input, renderInput } from './input.js';
