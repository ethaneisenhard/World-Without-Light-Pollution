/** Divider primitive. */

import { componentStamp } from '../../inspect-stamp.js';
import { escapeAttr } from '../../ssr-escape.js';

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical';
  tone?: 'subtle' | 'strong';
  inset?: 'none' | 'sm' | 'md';
  className?: string;
  instanceId?: string;
};
export type DividerSlots = Record<string, never>;
export type DividerRenderInput = { props?: DividerProps; slots?: DividerSlots; children?: string };

const TONE_CLASS: Record<NonNullable<DividerProps['tone']>, string> = { subtle: 'border-line/70', strong: 'border-line' };
const INSET_CLASS: Record<NonNullable<DividerProps['inset']>, string> = { none: '', sm: 'mx-2', md: 'mx-4' };

export function renderDivider(input: DividerRenderInput | DividerProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as DividerRenderInput) : { props: input as DividerProps };
  const props = normalized.props ?? {};
  const orientation = props.orientation ?? 'horizontal';
  const cls = [orientation === 'horizontal' ? 'h-px w-full border-0 border-t' : 'w-px self-stretch border-0 border-l', TONE_CLASS[props.tone ?? 'subtle'], INSET_CLASS[props.inset ?? 'none'], props.className ?? '']
    .filter(Boolean)
    .join(' ');
  const stamp = componentStamp({ componentId: 'divider', instanceId: props.instanceId });
  if (orientation === 'horizontal') return `<hr class="${escapeAttr(cls)}" ${stamp} />`;
  return `<div role="separator" aria-orientation="vertical" class="${escapeAttr(cls)}" ${stamp}></div>`;
}

export function Divider(props: DividerProps = {}): string {
  return renderDivider({ props });
}
