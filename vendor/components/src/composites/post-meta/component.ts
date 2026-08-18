import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'post-meta', title: 'Post meta', layer: 'composite', acceptsChildren: false, props: { compact: { type: 'enum', values: ['off', 'on'], default: 'off', title: 'Compact' } }, slots: { date: { title: 'Date', optional: true }, author: { title: 'Author', optional: true }, readTime: { title: 'Read time', optional: true } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { date: '2026-01-15', author: 'Ada Lovelace', readTime: '5 min read' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { date: text.date?.trim() || '', author: text.author?.trim() || '', readTime: text.readTime?.trim() || '' }; }
export type { PostMetaProps, PostMetaSlots } from './post-meta.js';
export { PostMeta, renderPostMeta } from './post-meta.js';
