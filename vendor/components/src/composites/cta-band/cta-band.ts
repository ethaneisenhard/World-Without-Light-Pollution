/** CTA band composite. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type CtaBandProps = { tone?: 'surface' | 'muted' | 'brand'; className?: string; instanceId?: string };
export type CtaBandSlots = { title?: string; text?: string; ctaPrimary?: string; ctaSecondary?: string };
export type CtaBandRenderInput = { props?: CtaBandProps; slots?: CtaBandSlots; children?: string };
const TONE_CLASS: Record<NonNullable<CtaBandProps['tone']>, string> = { surface: 'bg-paper text-ink', muted: 'bg-sand text-ink', brand: 'bg-accent text-inverse-fg' };

export function renderCtaBand(input: CtaBandRenderInput | CtaBandProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as CtaBandRenderInput) : { props: input as CtaBandProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({ componentId: 'cta-band', instanceId: props.instanceId });
  const cls = ['rounded-2xl border border-line px-6 py-8', TONE_CLASS[props.tone ?? 'surface'], props.className ?? ''].filter(Boolean).join(' ');
  return `<section class="${escapeAttr(cls)}" ${stamp}><div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div><h2 class="text-2xl font-bold" ${stampSlotAttrs({ componentId: 'cta-band', slot: 'title', instanceId: props.instanceId })}>${htmlOrText(slots.title ?? 'Call to action')}</h2>${slots.text ? `<p class="mt-2 text-ink-soft" ${stampSlotAttrs({ componentId: 'cta-band', slot: 'text', instanceId: props.instanceId })}>${htmlOrText(slots.text)}</p>` : ''}</div><div class="flex flex-wrap gap-3">${slots.ctaPrimary ? `<span ${stampSlotAttrs({ componentId: 'cta-band', slot: 'ctaPrimary', instanceId: props.instanceId })}>${slots.ctaPrimary}</span>` : ''}${slots.ctaSecondary ? `<span ${stampSlotAttrs({ componentId: 'cta-band', slot: 'ctaSecondary', instanceId: props.instanceId })}>${slots.ctaSecondary}</span>` : ''}</div></div></section>`;
}

export function CtaBand(props: CtaBandProps & CtaBandSlots & { children?: string } = {}): string {
  const { children, title, text, ctaPrimary, ctaSecondary, ...rest } = props;
  return renderCtaBand({ props: rest, slots: { title, text, ctaPrimary, ctaSecondary }, children });
}
