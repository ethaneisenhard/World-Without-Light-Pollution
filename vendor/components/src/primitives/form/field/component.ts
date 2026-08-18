import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'field', title: 'Field', layer: 'primitive', acceptsChildren: false, props: { layout: { type: 'enum', values: ['stacked', 'inline'], default: 'stacked', title: 'Layout' }, invalid: { type: 'enum', values: ['off', 'on'], default: 'off', title: 'Invalid' } }, slots: { label: { title: 'Label' }, hint: { title: 'Hint', optional: true }, error: { title: 'Error', optional: true }, control: { title: 'Control' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { label: 'Label', hint: 'Hint', error: 'Error', control: '' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { label: text.label?.trim() || 'Label', hint: text.hint?.trim() || '', error: text.error?.trim() || '', control: text.control?.trim() || '' }; }
export type { FieldProps, FieldSlots } from './field.js';
export { Field, renderField } from './field.js';
