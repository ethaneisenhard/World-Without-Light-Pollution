/** Card — bordered inset surface. */

import { componentStamp } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type CardTone = 'surface' | 'muted' | 'brand';
export type CardPadding = 'sm' | 'md' | 'lg';
export type CardProps = { tone?: CardTone; padding?: CardPadding; className?: string; instanceId?: string };
export type CardSlots = Record<string, never>;
export type CardRenderInput = { props?: CardProps; slots?: CardSlots; children?: string };

const TONE_CLASS: Record<CardTone, string> = {
  surface: 'border-line bg-paper text-ink',
  muted: 'border-line bg-sand text-ink',
  brand: 'border-line bg-accent text-inverse-fg',
};
const PAD_CLASS: Record<CardPadding, string> = { sm: 'p-4', md: 'p-6', lg: 'p-8' };

export function renderCard(input: CardRenderInput | CardProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as CardRenderInput) : { props: input as CardProps };
  const props = normalized.props ?? {};
  const children = normalized.children ?? '<p class="text-sm text-ink-soft">Card content</p>';
  const cls = ['rounded-xl border shadow-sm', TONE_CLASS[props.tone ?? 'surface'], PAD_CLASS[props.padding ?? 'md'], props.className ?? '']
    .filter(Boolean)
    .join(' ');
  const stamp = componentStamp({ componentId: 'card', instanceId: props.instanceId });
  return `<article class="${escapeAttr(cls)}" ${stamp}>${htmlOrText(children)}</article>`;
}

export function Card(props: CardProps & { children?: string } = {}): string {
  const { children, ...rest } = props;
  return renderCard({ props: rest, children });
}
