/** List primitive. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type ListProps = { ordered?: 'off' | 'on'; tone?: 'ink' | 'muted'; className?: string; instanceId?: string };
export type ListSlots = { items?: string };
export type ListRenderInput = { props?: ListProps; slots?: ListSlots; children?: string };

function lines(raw: string): string[] {
  return raw.split(String.fromCharCode(10)).map((line) => line.trim()).filter(Boolean);
}

export function renderList(input: ListRenderInput | ListProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as ListRenderInput) : { props: input as ListProps };
  const props = normalized.props ?? {};
  const tag = props.ordered === 'on' ? 'ol' : 'ul';
  const content = normalized.children ?? normalized.slots?.items ?? 'Item one\nItem two';
  const stamp = componentStamp({ componentId: 'list', instanceId: props.instanceId });
  const cls = [props.ordered === 'on' ? 'list-decimal' : 'list-disc', props.tone === 'muted' ? 'text-ink-soft' : 'text-ink', 'space-y-2 pl-5', props.className ?? ''].filter(Boolean).join(' ');
  const slotStamp = stampSlotAttrs({ componentId: 'list', slot: 'items', instanceId: props.instanceId });
  const items = lines(content).map((item) => `<li>${htmlOrText(item)}</li>`).join('');
  return `<${tag} class="${escapeAttr(cls)}" ${stamp} ${slotStamp}>${items}</${tag}>`;
}

export function List(props: ListProps & { children?: string; items?: string } = {}): string {
  const { children, items, ...rest } = props;
  return renderList({ props: rest, slots: { items }, children });
}
