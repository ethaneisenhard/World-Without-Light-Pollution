/** Form input primitive. */

import { componentStamp } from '../../../inspect-stamp.js';
import { escapeAttr } from '../../../ssr-escape.js';

export type InputProps = { type?: 'text' | 'email' | 'password' | 'search'; name?: string; placeholder?: string; value?: string; autocomplete?: string; invalid?: 'off' | 'on'; className?: string; instanceId?: string };
export type InputSlots = Record<string, never>;
export type InputRenderInput = { props?: InputProps; slots?: InputSlots; children?: string };

export function renderInput(input: InputRenderInput | InputProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as InputRenderInput) : { props: input as InputProps };
  const props = normalized.props ?? {};
  const stamp = componentStamp({ componentId: 'input', instanceId: props.instanceId });
  const cls = ['w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent/40', props.invalid === 'on' ? 'border-red-500' : '', props.className ?? ''].filter(Boolean).join(' ');
  return `<input type="${escapeAttr(props.type ?? 'text')}"${props.name ? ` name="${escapeAttr(props.name)}"` : ''}${props.placeholder ? ` placeholder="${escapeAttr(props.placeholder)}"` : ''}${props.value ? ` value="${escapeAttr(props.value)}"` : ''}${props.autocomplete ? ` autocomplete="${escapeAttr(props.autocomplete)}"` : ''} class="${escapeAttr(cls)}" ${stamp} />`;
}

export function Input(props: InputProps = {}): string { return renderInput({ props }); }
