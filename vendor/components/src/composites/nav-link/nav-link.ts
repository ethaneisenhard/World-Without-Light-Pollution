/** Nav link composite. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type NavLinkProps = { href?: string; current?: 'off' | 'on'; className?: string; instanceId?: string };
export type NavLinkSlots = { label?: string };
export type NavLinkRenderInput = { props?: NavLinkProps; slots?: NavLinkSlots; children?: string };

export function renderNavLink(input: NavLinkRenderInput | NavLinkProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as NavLinkRenderInput) : { props: input as NavLinkProps };
  const props = normalized.props ?? {};
  const stamp = componentStamp({ componentId: 'nav-link', instanceId: props.instanceId });
  const current = props.current === 'on';
  const cls = ['rounded-md px-2 py-1 text-sm font-medium text-ink-soft hover:text-ink', current ? 'text-ink' : '', props.className ?? ''].filter(Boolean).join(' ');
  return `<a href="${escapeAttr(props.href ?? '#')}" aria-current="${current ? 'page' : 'false'}" class="${escapeAttr(cls)}" ${stamp}><span ${stampSlotAttrs({ componentId: 'nav-link', slot: 'label', instanceId: props.instanceId })}>${htmlOrText(normalized.children ?? normalized.slots?.label ?? 'Link')}</span></a>`;
}

export function NavLink(props: NavLinkProps & NavLinkSlots & { children?: string } = {}): string {
  const { children, label, ...rest } = props;
  return renderNavLink({ props: rest, slots: { label }, children });
}
