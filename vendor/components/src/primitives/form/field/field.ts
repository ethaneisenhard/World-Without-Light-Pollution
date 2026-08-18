/** Form field primitive. */

import { componentStamp, stampSlotAttrs, stampSlotOntoHtml } from '../../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../../ssr-escape.js';

export type FieldProps = { layout?: 'stacked' | 'inline'; invalid?: 'off' | 'on'; className?: string; instanceId?: string };
export type FieldSlots = { label?: string; hint?: string; error?: string; control?: string };
export type FieldRenderInput = { props?: FieldProps; slots?: FieldSlots; children?: string };

export function renderField(input: FieldRenderInput | FieldProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as FieldRenderInput) : { props: input as FieldProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({ componentId: 'field', instanceId: props.instanceId });
  const labelStamp = stampSlotAttrs({ componentId: 'field', slot: 'label', instanceId: props.instanceId });
  const hintStamp = stampSlotAttrs({ componentId: 'field', slot: 'hint', instanceId: props.instanceId });
  const errorStamp = stampSlotAttrs({ componentId: 'field', slot: 'error', instanceId: props.instanceId });
  const controlStamp = stampSlotAttrs({ componentId: 'field', slot: 'control', instanceId: props.instanceId });
  const cls = ['grid gap-2', props.layout === 'inline' ? 'sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-start' : '', props.invalid === 'on' ? 'text-ink-soft' : '', props.className ?? ''].filter(Boolean).join(' ');
  const controlHtml = stampSlotOntoHtml({ componentId: 'field', slot: 'control', html: normalized.children ?? slots.control ?? '<input class="w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink" />', instanceId: props.instanceId });
  return `<div class="${escapeAttr(cls)}" ${stamp}><label class="text-sm font-medium text-ink" ${labelStamp}>${htmlOrText(slots.label ?? 'Label')}</label><div ${controlStamp}>${controlHtml}</div>${slots.hint ? `<p class="text-sm text-ink-soft" ${hintStamp}>${htmlOrText(slots.hint)}</p>` : ''}${slots.error ? `<p class="text-sm text-ink-soft" ${errorStamp}>${htmlOrText(slots.error)}</p>` : ''}</div>`;
}

export function Field(props: FieldProps & FieldSlots & { children?: string } = {}): string {
  const { children, label, hint, error, control, ...rest } = props;
  return renderField({ props: rest, slots: { label, hint, error, control }, children });
}
