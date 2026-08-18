/** Accordion item primitive. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type AccordionItemProps = { open?: 'off' | 'on'; className?: string; instanceId?: string };
export type AccordionItemSlots = { summary?: string; content?: string };
export type AccordionItemRenderInput = { props?: AccordionItemProps; slots?: AccordionItemSlots; children?: string };

export function renderAccordionItem(input: AccordionItemRenderInput | AccordionItemProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as AccordionItemRenderInput) : { props: input as AccordionItemProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({ componentId: 'accordion-item', instanceId: props.instanceId });
  const summaryStamp = stampSlotAttrs({ componentId: 'accordion-item', slot: 'summary', instanceId: props.instanceId });
  const contentStamp = stampSlotAttrs({ componentId: 'accordion-item', slot: 'content', instanceId: props.instanceId });
  const cls = ['rounded-xl border border-line bg-paper text-ink', props.className ?? ''].filter(Boolean).join(' ');
  return `<details${props.open === 'on' ? ' open' : ''} class="${escapeAttr(cls)}" ${stamp}><summary class="cursor-pointer list-none px-4 py-3 font-medium" ${summaryStamp}>${htmlOrText(slots.summary ?? 'Accordion item')}</summary><div class="border-t border-line px-4 py-3 text-ink-soft" ${contentStamp}>${htmlOrText(normalized.children ?? slots.content ?? 'Accordion content')}</div></details>`;
}

export function AccordionItem(props: AccordionItemProps & AccordionItemSlots & { children?: string } = {}): string {
  const { children, summary, content, ...rest } = props;
  return renderAccordionItem({ props: rest, slots: { summary, content }, children });
}
