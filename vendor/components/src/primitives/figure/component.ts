import type { DesignComponentMeta } from '@glassbox-studio/studio-core/browser';
export const meta = { id: 'figure', title: 'Figure', layer: 'primitive', acceptsChildren: false, props: { ratio: { type: 'enum', values: ['1:1', '4:3', '16:9'], default: '16:9', title: 'Ratio' }, align: { type: 'enum', values: ['left', 'center'], default: 'left', title: 'Align' } }, slots: { media: { title: 'Media' }, caption: { title: 'Caption', optional: true } } } as const satisfies DesignComponentMeta;
export const slotTextDefaults = { media: '', caption: 'Figure caption' } as const;
export function slotsFromPlainText(text: Record<string, string>): Record<string, string> { return { media: text.media?.trim() || '', caption: text.caption?.trim() || 'Figure caption' }; }
export type { FigureProps, FigureSlots } from './figure.js';
export { Figure, renderFigure } from './figure.js';
