/** Post meta composite. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type PostMetaProps = { compact?: 'off' | 'on'; className?: string; instanceId?: string };
export type PostMetaSlots = { date?: string; author?: string; readTime?: string };
export type PostMetaRenderInput = { props?: PostMetaProps; slots?: PostMetaSlots; children?: string };

export function renderPostMeta(input: PostMetaRenderInput | PostMetaProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as PostMetaRenderInput) : { props: input as PostMetaProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({ componentId: 'post-meta', instanceId: props.instanceId });
  const cls = ['flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft', props.compact === 'on' ? 'text-xs' : '', props.className ?? ''].filter(Boolean).join(' ');
  return `<p class="${escapeAttr(cls)}" ${stamp}>${slots.date ? `<span ${stampSlotAttrs({ componentId: 'post-meta', slot: 'date', instanceId: props.instanceId })}>${htmlOrText(slots.date)}</span>` : ''}${slots.author ? `<span ${stampSlotAttrs({ componentId: 'post-meta', slot: 'author', instanceId: props.instanceId })}>${htmlOrText(slots.author)}</span>` : ''}${slots.readTime ? `<span ${stampSlotAttrs({ componentId: 'post-meta', slot: 'readTime', instanceId: props.instanceId })}>${htmlOrText(slots.readTime)}</span>` : ''}</p>`;
}

export function PostMeta(props: PostMetaProps & PostMetaSlots & { children?: string } = {}): string {
  const { children, date, author, readTime, ...rest } = props;
  return renderPostMeta({ props: rest, slots: { date, author, readTime }, children });
}
