/** Hero composite. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type HeroProps = { layout?: 'center' | 'split'; className?: string; instanceId?: string };
export type HeroSlots = { eyebrow?: string; title?: string; subtitle?: string; ctaPrimary?: string; ctaSecondary?: string; media?: string };
export type HeroRenderInput = { props?: HeroProps; slots?: HeroSlots; children?: string };

export function renderHero(input: HeroRenderInput | HeroProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as HeroRenderInput) : { props: input as HeroProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({ componentId: 'hero', instanceId: props.instanceId });
  const cls = ['grid gap-10 py-16', props.layout === 'split' ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-center' : 'justify-items-center text-center', props.className ?? ''].filter(Boolean).join(' ');
  return `<section class="${escapeAttr(cls)}" ${stamp}>${slots.eyebrow ? `<p class="text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft" ${stampSlotAttrs({ componentId: 'hero', slot: 'eyebrow', instanceId: props.instanceId })}>${htmlOrText(slots.eyebrow)}</p>` : ''}<div class="space-y-4"><h1 class="text-4xl font-bold tracking-tight text-ink" ${stampSlotAttrs({ componentId: 'hero', slot: 'title', instanceId: props.instanceId })}>${htmlOrText(slots.title ?? 'Hero title')}</h1>${slots.subtitle ? `<p class="text-lg text-ink-soft" ${stampSlotAttrs({ componentId: 'hero', slot: 'subtitle', instanceId: props.instanceId })}>${htmlOrText(slots.subtitle)}</p>` : ''}<div class="flex flex-wrap gap-3 ${props.layout === 'center' ? 'justify-center' : ''}">${slots.ctaPrimary ? `<span ${stampSlotAttrs({ componentId: 'hero', slot: 'ctaPrimary', instanceId: props.instanceId })}>${slots.ctaPrimary}</span>` : ''}${slots.ctaSecondary ? `<span ${stampSlotAttrs({ componentId: 'hero', slot: 'ctaSecondary', instanceId: props.instanceId })}>${slots.ctaSecondary}</span>` : ''}</div></div>${slots.media ? `<div class="overflow-hidden rounded-2xl border border-line bg-paper" ${stampSlotAttrs({ componentId: 'hero', slot: 'media', instanceId: props.instanceId })}>${slots.media}</div>` : ''}</section>`;
}

export function Hero(props: HeroProps & HeroSlots & { children?: string } = {}): string {
  const { children, eyebrow, title, subtitle, ctaPrimary, ctaSecondary, media, ...rest } = props;
  return renderHero({ props: rest, slots: { eyebrow, title, subtitle, ctaPrimary, ctaSecondary, media }, children });
}
