/** Pill primitive. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type PillProps = { tone?: 'neutral' | 'accent' | 'muted'; className?: string; instanceId?: string };
export type PillSlots = { label?: string };
export type PillRenderInput = { props?: PillProps; slots?: PillSlots; children?: string };
const TONE_CLASS: Record<NonNullable<PillProps['tone']>, string> = { neutral: 'bg-paper text-ink border-line', accent: 'bg-accent text-inverse-fg border-accent', muted: 'bg-sand text-ink border-line' };

export function renderPill(input: PillRenderInput | (PillProps & PillSlots) = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as PillRenderInput) : { props: input as PillProps, slots: { label: (input as PillProps & PillSlots).label } };
  const props = normalized.props ?? {};
  const label = normalized.children ?? normalized.slots?.label ?? 'Pill';
  const stamp = componentStamp({ componentId: 'pill', instanceId: props.instanceId });
  const slotStamp = stampSlotAttrs({ componentId: 'pill', slot: 'label', instanceId: props.instanceId });
  const cls = ['inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', TONE_CLASS[props.tone ?? 'neutral'], props.className ?? ''].filter(Boolean).join(' ');
  return `<span class="${escapeAttr(cls)}" ${stamp}><span ${slotStamp}>${htmlOrText(label)}</span></span>`;
}

export function Pill(props: PillProps & PillSlots & { children?: string } = {}): string {
  const { children, label, ...rest } = props;
  return renderPill({ props: rest, slots: { label }, children });
}
