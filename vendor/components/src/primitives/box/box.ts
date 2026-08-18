/**
 * Box — generic semantic wrapper.
 */

import { componentStamp } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type BoxTone = 'transparent' | 'surface' | 'muted' | 'brand';
export type BoxPadding = 'none' | 'sm' | 'md' | 'lg';
export type BoxRadius = 'none' | 'md' | 'lg' | 'xl';

export type BoxProps = {
  tone?: BoxTone;
  padding?: BoxPadding;
  radius?: BoxRadius;
  className?: string;
  instanceId?: string;
};

export type BoxSlots = Record<string, never>;
export type BoxRenderInput = { props?: BoxProps; slots?: BoxSlots; children?: string };

const TONE_CLASS: Record<BoxTone, string> = {
  transparent: '',
  surface: 'bg-paper text-ink',
  muted: 'bg-sand text-ink',
  brand: 'bg-accent text-inverse-fg',
};
const PAD_CLASS: Record<BoxPadding, string> = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };
const RADIUS_CLASS: Record<BoxRadius, string> = { none: '', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl' };

export function renderBox(input: BoxRenderInput | BoxProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as BoxRenderInput) : { props: input as BoxProps };
  const props = normalized.props ?? {};
  const children = normalized.children ?? '<p class="text-sm text-ink-soft">Box content</p>';
  const cls = [TONE_CLASS[props.tone ?? 'transparent'], PAD_CLASS[props.padding ?? 'md'], RADIUS_CLASS[props.radius ?? 'lg'], props.className ?? '']
    .filter(Boolean)
    .join(' ');
  const stamp = componentStamp({ componentId: 'box', instanceId: props.instanceId });
  return `<div class="${escapeAttr(cls)}" ${stamp}>${htmlOrText(children)}</div>`;
}

export function Box(props: BoxProps & { children?: string } = {}): string {
  const { children, ...rest } = props;
  return renderBox({ props: rest, children });
}
