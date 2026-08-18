/** Figure primitive. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type FigureProps = { ratio?: '1:1' | '4:3' | '16:9'; align?: 'left' | 'center'; className?: string; instanceId?: string };
export type FigureSlots = { media?: string; caption?: string };
export type FigureRenderInput = { props?: FigureProps; slots?: FigureSlots; children?: string };
const RATIO_CLASS: Record<NonNullable<FigureProps['ratio']>, string> = { '1:1': 'aspect-square', '4:3': 'aspect-[4/3]', '16:9': 'aspect-[16/9]' };

export function renderFigure(input: FigureRenderInput | FigureProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as FigureRenderInput) : { props: input as FigureProps };
  const props = normalized.props ?? {};
  const media = normalized.children ?? normalized.slots?.media ?? '<div class="h-full w-full bg-gradient-to-br from-sand to-paper-raised"></div>';
  const caption = normalized.slots?.caption ?? '';
  const cls = ['space-y-3', props.align === 'center' ? 'mx-auto text-center' : '', props.className ?? ''].filter(Boolean).join(' ');
  const stamp = componentStamp({ componentId: 'figure', instanceId: props.instanceId });
  const mediaStamp = stampSlotAttrs({ componentId: 'figure', slot: 'media', instanceId: props.instanceId });
  const captionStamp = stampSlotAttrs({ componentId: 'figure', slot: 'caption', instanceId: props.instanceId });
  return `<figure class="${escapeAttr(cls)}" ${stamp}><div class="overflow-hidden rounded-xl border border-line bg-paper ${RATIO_CLASS[props.ratio ?? '16:9']}" ${mediaStamp}>${htmlOrText(media)}</div>${caption ? `<figcaption class="text-sm text-ink-soft" ${captionStamp}>${htmlOrText(caption)}</figcaption>` : ''}</figure>`;
}

export function Figure(props: FigureProps & FigureSlots & { children?: string } = {}): string {
  const { children, media, caption, ...rest } = props;
  return renderFigure({ props: rest, slots: { media, caption }, children });
}
