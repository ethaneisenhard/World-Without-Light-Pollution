import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'accordion-item', title: 'Accordion item', layer: 'primitive', acceptsChildren: false, props: { open: { type: 'enum', values: ['off', 'on'], default: 'off', title: 'Open' } }, slots: { summary: { title: 'Summary' }, content: { title: 'Content' } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { summary: 'Accordion item', content: 'Accordion content' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { summary: text.summary?.trim() || 'Accordion item', content: text.content?.trim() || 'Accordion content' }; }
export type { AccordionItemProps, AccordionItemSlots } from './accordion-item.js';
export { AccordionItem, renderAccordionItem } from './accordion-item.js';
