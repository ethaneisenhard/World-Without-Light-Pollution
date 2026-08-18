/** Post card composite. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type PostCardProps = { layout?: 'stack' | 'split'; className?: string; instanceId?: string };
export type PostCardSlots = { cover?: string; title?: string; meta?: string; excerpt?: string; cta?: string };
export type PostCardRenderInput = { props?: PostCardProps; slots?: PostCardSlots; children?: string };

export function renderPostCard(input: PostCardRenderInput | PostCardProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as PostCardRenderInput) : { props: input as PostCardProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({ componentId: 'post-card', instanceId: props.instanceId });
  const cls = ['rounded-2xl border border-line bg-paper text-ink shadow-sm overflow-hidden', props.layout === 'split' ? 'grid gap-0 lg:grid-cols-[18rem_minmax(0,1fr)]' : 'grid gap-4', props.className ?? ''].filter(Boolean).join(' ');
  return `<article class="${escapeAttr(cls)}" ${stamp}>${slots.cover ? `<div class="bg-sand" ${stampSlotAttrs({ componentId: 'post-card', slot: 'cover', instanceId: props.instanceId })}>${slots.cover}</div>` : ''}<div class="p-6 space-y-3"><h3 class="text-xl font-bold" ${stampSlotAttrs({ componentId: 'post-card', slot: 'title', instanceId: props.instanceId })}>${htmlOrText(slots.title ?? 'Post title')}</h3>${slots.meta ? `<p class="text-sm text-ink-soft" ${stampSlotAttrs({ componentId: 'post-card', slot: 'meta', instanceId: props.instanceId })}>${htmlOrText(slots.meta)}</p>` : ''}${slots.excerpt ? `<p class="text-ink-soft" ${stampSlotAttrs({ componentId: 'post-card', slot: 'excerpt', instanceId: props.instanceId })}>${htmlOrText(slots.excerpt)}</p>` : ''}${slots.cta ? `<div ${stampSlotAttrs({ componentId: 'post-card', slot: 'cta', instanceId: props.instanceId })}>${slots.cta}</div>` : ''}</div></article>`;
}

export function PostCard(props: PostCardProps & PostCardSlots & { children?: string } = {}): string {
  const { children, cover, title, meta, excerpt, cta, ...rest } = props;
  return renderPostCard({ props: rest, slots: { cover, title, meta, excerpt, cta }, children });
}
