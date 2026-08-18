/** Blockquote primitive. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type BlockquoteProps = { align?: 'left' | 'center'; className?: string; instanceId?: string };
export type BlockquoteSlots = { quote?: string; cite?: string };
export type BlockquoteRenderInput = { props?: BlockquoteProps; slots?: BlockquoteSlots; children?: string };

export function renderBlockquote(input: BlockquoteRenderInput | BlockquoteProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as BlockquoteRenderInput) : { props: input as BlockquoteProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({ componentId: 'blockquote', instanceId: props.instanceId });
  const quoteStamp = stampSlotAttrs({ componentId: 'blockquote', slot: 'quote', instanceId: props.instanceId });
  const citeStamp = stampSlotAttrs({ componentId: 'blockquote', slot: 'cite', instanceId: props.instanceId });
  const cls = ['border-l-4 border-line pl-4 italic text-ink', props.align === 'center' ? 'mx-auto text-center border-l-0 border-t-4 pt-4' : '', props.className ?? ''].filter(Boolean).join(' ');
  return `<blockquote class="${escapeAttr(cls)}" ${stamp}><p ${quoteStamp}>${htmlOrText(normalized.children ?? slots.quote ?? 'Quote')}</p>${slots.cite ? `<footer class="mt-2 not-italic text-sm text-ink-soft" ${citeStamp}>${htmlOrText(slots.cite)}</footer>` : ''}</blockquote>`;
}

export function Blockquote(props: BlockquoteProps & BlockquoteSlots & { children?: string } = {}): string {
  const { children, quote, cite, ...rest } = props;
  return renderBlockquote({ props: rest, slots: { quote, cite }, children });
}
