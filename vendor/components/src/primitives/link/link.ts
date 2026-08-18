/** Link primitive. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type LinkProps = { href?: string; variant?: 'inline' | 'subtle' | 'button'; external?: 'off' | 'on'; className?: string; instanceId?: string };
export type LinkSlots = { label?: string };
export type LinkRenderInput = { props?: LinkProps; slots?: LinkSlots; children?: string };

const VARIANT_CLASS: Record<NonNullable<LinkProps['variant']>, string> = {
  inline: 'text-accent underline underline-offset-4',
  subtle: 'text-ink-soft hover:text-ink',
  button: 'inline-flex rounded-full border border-line bg-paper px-3 py-1 text-sm text-ink hover:bg-paper-raised',
};

export function renderLink(input: LinkRenderInput | (LinkProps & LinkSlots) = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input
    ? (input as LinkRenderInput)
    : { props: input as LinkProps, slots: { label: (input as LinkProps & LinkSlots).label } };
  const props = normalized.props ?? {};
  const label = normalized.children ?? normalized.slots?.label ?? 'Link';
  const external = props.external === 'on' || /^https?:\/\//.test(props.href ?? '');
  const stamp = componentStamp({ componentId: 'link', instanceId: props.instanceId });
  const slotStamp = stampSlotAttrs({ componentId: 'link', slot: 'label', instanceId: props.instanceId });
  const cls = [VARIANT_CLASS[props.variant ?? 'inline'], props.className ?? ''].filter(Boolean).join(' ');
  const target = external ? ' target="_blank" rel="noreferrer noopener"' : '';
  return `<a href="${escapeAttr(props.href ?? '#')}" class="${escapeAttr(cls)}" ${stamp}${target}><span ${slotStamp}>${htmlOrText(label)}</span></a>`;
}

export function Link(props: LinkProps & LinkSlots & { children?: string } = {}): string {
  const { children, label, ...rest } = props;
  return renderLink({ props: rest, slots: { label }, children });
}
