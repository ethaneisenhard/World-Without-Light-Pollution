/** Icon primitive. */

import { componentStamp } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type IconProps = { name?: string; size?: 'xs' | 'sm' | 'md'; tone?: 'ink' | 'muted' | 'accent'; label?: string; className?: string; instanceId?: string };
export type IconSlots = Record<string, never>;
export type IconRenderInput = { props?: IconProps; slots?: IconSlots; children?: string };
const SIZE_CLASS: Record<NonNullable<IconProps['size']>, string> = { xs: 'h-4 w-4 text-xs', sm: 'h-5 w-5 text-sm', md: 'h-6 w-6 text-base' };
const TONE_CLASS: Record<NonNullable<IconProps['tone']>, string> = { ink: 'text-ink', muted: 'text-ink-soft', accent: 'text-accent' };

export function renderIcon(input: IconRenderInput | IconProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as IconRenderInput) : { props: input as IconProps };
  const props = normalized.props ?? {};
  const stamp = componentStamp({ componentId: 'icon', instanceId: props.instanceId });
  const cls = ['inline-flex items-center justify-center rounded-md border border-line bg-paper', SIZE_CLASS[props.size ?? 'sm'], TONE_CLASS[props.tone ?? 'muted'], props.className ?? ''].filter(Boolean).join(' ');
  const aria = props.label ? ` role="img" aria-label="${escapeAttr(props.label)}"` : ' aria-hidden="true"';
  return `<span class="${escapeAttr(cls)}" data-icon="${escapeAttr(props.name ?? 'icon')}"${aria} ${stamp}>${htmlOrText((props.name ?? '•').slice(0, 1).toUpperCase())}</span>`;
}

export function Icon(props: IconProps = {}): string { return renderIcon({ props }); }
