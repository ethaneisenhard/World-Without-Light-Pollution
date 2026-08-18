/** Callout primitive. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type CalloutProps = { tone?: 'info' | 'success' | 'warning'; className?: string; instanceId?: string };
export type CalloutSlots = { title?: string; content?: string };
export type CalloutRenderInput = { props?: CalloutProps; slots?: CalloutSlots; children?: string };
const TONE_CLASS: Record<NonNullable<CalloutProps['tone']>, string> = { info: 'border-line bg-paper text-ink', success: 'border-line bg-sand text-ink', warning: 'border-line bg-paper-raised text-ink' };

export function renderCallout(input: CalloutRenderInput | (CalloutProps & CalloutSlots) = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as CalloutRenderInput) : { props: input as CalloutProps, slots: { title: (input as CalloutProps & CalloutSlots).title, content: (input as CalloutProps & CalloutSlots).content } };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({ componentId: 'callout', instanceId: props.instanceId });
  const titleStamp = stampSlotAttrs({ componentId: 'callout', slot: 'title', instanceId: props.instanceId });
  const contentStamp = stampSlotAttrs({ componentId: 'callout', slot: 'content', instanceId: props.instanceId });
  const cls = ['rounded-xl border px-4 py-3', TONE_CLASS[props.tone ?? 'info'], props.className ?? ''].filter(Boolean).join(' ');
  return `<aside class="${escapeAttr(cls)}" ${stamp}>${slots.title ? `<h3 class="font-semibold text-ink" ${titleStamp}>${htmlOrText(slots.title)}</h3>` : ''}<div class="mt-2 text-sm text-ink-soft" ${contentStamp}>${htmlOrText(normalized.children ?? slots.content ?? 'Callout content')}</div></aside>`;
}

export function Callout(props: CalloutProps & CalloutSlots & { children?: string } = {}): string {
  const { children, title, content, ...rest } = props;
  return renderCallout({ props: rest, slots: { title, content }, children });
}
