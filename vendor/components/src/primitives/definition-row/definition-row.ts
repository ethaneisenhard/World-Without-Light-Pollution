/** Definition row primitive. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type DefinitionRowProps = { className?: string; instanceId?: string };
export type DefinitionRowSlots = { term?: string; description?: string };
export type DefinitionRowRenderInput = { props?: DefinitionRowProps; slots?: DefinitionRowSlots; children?: string };

export function renderDefinitionRow(input: DefinitionRowRenderInput | DefinitionRowProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as DefinitionRowRenderInput) : { props: input as DefinitionRowProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({ componentId: 'definition-row', instanceId: props.instanceId });
  const termStamp = stampSlotAttrs({ componentId: 'definition-row', slot: 'term', instanceId: props.instanceId });
  const descStamp = stampSlotAttrs({ componentId: 'definition-row', slot: 'description', instanceId: props.instanceId });
  const cls = ['grid gap-1 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6', props.className ?? ''].filter(Boolean).join(' ');
  return `<div class="${escapeAttr(cls)}" ${stamp}><dt class="font-medium text-ink" ${termStamp}>${htmlOrText(slots.term ?? 'Term')}</dt><dd class="text-ink-soft" ${descStamp}>${htmlOrText(normalized.children ?? slots.description ?? 'Description')}</dd></div>`;
}

export function DefinitionRow(props: DefinitionRowProps & DefinitionRowSlots & { children?: string } = {}): string {
  const { children, term, description, ...rest } = props;
  return renderDefinitionRow({ props: rest, slots: { term, description }, children });
}
