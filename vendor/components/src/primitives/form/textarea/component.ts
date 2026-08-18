import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'textarea', title: 'Textarea', layer: 'primitive', acceptsChildren: false, props: { rows: { type: 'enum', values: ['3', '4', '6', '8'], default: '4', title: 'Rows' }, invalid: { type: 'enum', values: ['off', 'on'], default: 'off', title: 'Invalid' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = {} as const;
export function slotsFromPlainText(): Record<string, string> { return {}; }
export type { TextareaProps, TextareaSlots } from './textarea.js';
export { Textarea, renderTextarea } from './textarea.js';
