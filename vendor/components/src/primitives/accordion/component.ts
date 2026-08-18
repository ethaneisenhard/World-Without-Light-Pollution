import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'accordion', title: 'Accordion', layer: 'primitive', acceptsChildren: true, props: {} } as const satisfies DesignComponentMeta;
export const slotTextDefaults = {} as const;
export function slotsFromPlainText(): Record<string, string> { return {}; }
export type { AccordionProps, AccordionSlots } from './accordion.js';
export { Accordion, renderAccordion } from './accordion.js';
