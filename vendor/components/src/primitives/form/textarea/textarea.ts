/** Form textarea primitive. */

import { componentStamp } from '../../../inspect-stamp.js';
import { escapeAttr, escapeHtml } from '../../../ssr-escape.js';

export type TextareaProps = { name?: string; placeholder?: string; value?: string; rows?: '3' | '4' | '6' | '8'; invalid?: 'off' | 'on'; className?: string; instanceId?: string };
export type TextareaSlots = Record<string, never>;
export type TextareaRenderInput = { props?: TextareaProps; slots?: TextareaSlots; children?: string };

export function renderTextarea(input: TextareaRenderInput | TextareaProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as TextareaRenderInput) : { props: input as TextareaProps };
  const props = normalized.props ?? {};
  const stamp = componentStamp({ componentId: 'textarea', instanceId: props.instanceId });
  const cls = ['w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent/40', props.invalid === 'on' ? 'border-red-500' : '', props.className ?? ''].filter(Boolean).join(' ');
  return `<textarea${props.name ? ` name="${escapeAttr(props.name)}"` : ''}${props.placeholder ? ` placeholder="${escapeAttr(props.placeholder)}"` : ''}${props.rows ? ` rows="${escapeAttr(props.rows)}"` : ''} class="${escapeAttr(cls)}" ${stamp}>${escapeHtml(props.value ?? '')}</textarea>`;
}

export function Textarea(props: TextareaProps = {}): string { return renderTextarea({ props }); }
