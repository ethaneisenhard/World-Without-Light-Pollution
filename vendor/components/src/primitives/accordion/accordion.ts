/** Accordion wrapper primitive. */

import { componentStamp } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type AccordionProps = { className?: string; instanceId?: string };
export type AccordionSlots = Record<string, never>;
export type AccordionRenderInput = { props?: AccordionProps; slots?: AccordionSlots; children?: string };

export function renderAccordion(input: AccordionRenderInput | AccordionProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as AccordionRenderInput) : { props: input as AccordionProps };
  const props = normalized.props ?? {};
  const stamp = componentStamp({ componentId: 'accordion', instanceId: props.instanceId });
  const cls = ['space-y-3', props.className ?? ''].filter(Boolean).join(' ');
  return `<div class="${escapeAttr(cls)}" ${stamp}>${htmlOrText(normalized.children ?? '<details open><summary>Accordion item</summary><div>Accordion content</div></details>')}</div>`;
}

export function Accordion(props: AccordionProps & { children?: string } = {}): string {
  const { children, ...rest } = props;
  return renderAccordion({ props: rest, children });
}
