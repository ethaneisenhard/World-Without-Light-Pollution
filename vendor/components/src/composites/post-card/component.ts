import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'post-card', title: 'Post card', layer: 'composite', acceptsChildren: false, props: { layout: { type: 'enum', values: ['stack', 'split'], default: 'stack', title: 'Layout' } }, slots: { cover: { title: 'Cover', optional: true }, title: { title: 'Title' }, meta: { title: 'Meta', optional: true }, excerpt: { title: 'Excerpt', optional: true }, cta: { title: 'CTA', optional: true } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { cover: '', title: 'Post title', meta: 'Meta', excerpt: 'Short post excerpt.', cta: 'Read more' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { cover: text.cover?.trim() || '', title: text.title?.trim() || 'Post title', meta: text.meta?.trim() || '', excerpt: text.excerpt?.trim() || '', cta: text.cta?.trim() || '' }; }
export type { PostCardProps, PostCardSlots } from './post-card.js';
export { PostCard, renderPostCard } from './post-card.js';
