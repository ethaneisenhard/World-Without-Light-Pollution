/** Contact form composite. */

import { componentStamp, stampSlotAttrs } from '../../inspect-stamp.js';
import { escapeAttr, htmlOrText } from '../../ssr-escape.js';

export type ContactFormProps = { action?: string; method?: 'get' | 'post'; className?: string; instanceId?: string };
export type ContactFormSlots = { title?: string; subtitle?: string; name?: string; email?: string; message?: string; submit?: string };
export type ContactFormRenderInput = { props?: ContactFormProps; slots?: ContactFormSlots; children?: string };

export function renderContactForm(input: ContactFormRenderInput | ContactFormProps = {}): string {
  const normalized = 'props' in input || 'slots' in input || 'children' in input ? (input as ContactFormRenderInput) : { props: input as ContactFormProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({ componentId: 'contact-form', instanceId: props.instanceId });
  const cls = ['grid gap-6 rounded-2xl border border-line bg-paper p-6 text-ink', props.className ?? ''].filter(Boolean).join(' ');
  return `<section class="${escapeAttr(cls)}" ${stamp}><div class="space-y-2"><h2 class="text-2xl font-bold" ${stampSlotAttrs({ componentId: 'contact-form', slot: 'title', instanceId: props.instanceId })}>${htmlOrText(slots.title ?? 'Contact us')}</h2>${slots.subtitle ? `<p class="text-ink-soft" ${stampSlotAttrs({ componentId: 'contact-form', slot: 'subtitle', instanceId: props.instanceId })}>${htmlOrText(slots.subtitle)}</p>` : ''}</div><form action="${escapeAttr(props.action ?? '#')}" method="${escapeAttr(props.method ?? 'post')}" class="grid gap-4"><div ${stampSlotAttrs({ componentId: 'contact-form', slot: 'name', instanceId: props.instanceId })}>${slots.name ?? '<label class="grid gap-2"><span class="text-sm font-medium">Name</span><input class="w-full rounded-lg border border-line bg-paper px-3 py-2" name="name" /></label>'}</div><div ${stampSlotAttrs({ componentId: 'contact-form', slot: 'email', instanceId: props.instanceId })}>${slots.email ?? '<label class="grid gap-2"><span class="text-sm font-medium">Email</span><input class="w-full rounded-lg border border-line bg-paper px-3 py-2" name="email" type="email" /></label>'}</div><div ${stampSlotAttrs({ componentId: 'contact-form', slot: 'message', instanceId: props.instanceId })}>${slots.message ?? '<label class="grid gap-2"><span class="text-sm font-medium">Message</span><textarea class="min-h-32 w-full rounded-lg border border-line bg-paper px-3 py-2" name="message"></textarea></label>'}</div><div ${stampSlotAttrs({ componentId: 'contact-form', slot: 'submit', instanceId: props.instanceId })}>${slots.submit ?? '<button class="inline-flex rounded-full bg-accent px-4 py-2 font-semibold text-inverse-fg" type="submit">Send</button>'}</div></form></section>`;
}

export function ContactForm(props: ContactFormProps & ContactFormSlots & { children?: string } = {}): string {
  const { children, title, subtitle, name, email, message, submit, ...rest } = props;
  return renderContactForm({ props: rest, slots: { title, subtitle, name, email, message, submit }, children });
}
