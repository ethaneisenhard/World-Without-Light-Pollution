/**
 * Button — headless action primitive.
 * Structure + inspect attrs only. Visuals via Tailwind `className` (or project CSS).
 * Tag: <button> or <a href> + data-as-component="button".
 */

import { componentStamp, stampSlotAttrs } from "../../inspect-stamp.js";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonType = "button" | "submit" | "reset";

export type ButtonProps = {
  variant?: ButtonVariant;
  /** When set, renders `<a>` instead of `<button>`. */
  href?: string;
  type?: ButtonType;
  disabled?: boolean;
  /** Project Tailwind / utility classes — primitive ships none. */
  className?: string;
  instanceId?: string;
};

export type ButtonSlots = {
  /** Visible label (plain text or HTML). */
  label?: string;
};

export type ButtonRenderInput = {
  props?: ButtonProps;
  slots?: ButtonSlots;
  children?: string;
};

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderButton(
  input: ButtonRenderInput | (ButtonProps & ButtonSlots) = {},
): string {
  let props: ButtonProps;
  let slots: ButtonSlots;
  let children: string | undefined;

  if ("props" in input || "slots" in input || "children" in input) {
    const r = input as ButtonRenderInput;
    props = r.props ?? {};
    slots = r.slots ?? {};
    children = r.children;
  } else {
    const flat = input as ButtonProps & ButtonSlots;
    props = {
      variant: flat.variant,
      href: flat.href,
      type: flat.type,
      disabled: flat.disabled,
      className: flat.className,
      instanceId: flat.instanceId,
    };
    slots = { label: flat.label };
  }

  const variant = props.variant ?? "primary";
  const labelRaw = children ?? slots.label ?? "Button";
  const labelLooksLikeHtml = /<[a-z][\s\S]*>/i.test(labelRaw);
  const labelHtml = labelLooksLikeHtml ? labelRaw : escapeHtml(labelRaw);

  const stamp = componentStamp({
    componentId: "button",
    instanceId: props.instanceId,
  });
  const slotStamp = stampSlotAttrs({
    componentId: "button",
    slot: "label",
    instanceId: props.instanceId,
  });
  const label = `<span ${slotStamp}>${labelHtml}</span>`;

  const cls = props.className ? ` class="${escapeAttr(props.className)}"` : "";
  const variantAttr = ` data-variant="${escapeAttr(variant)}"`;

  if (props.href) {
    return `<a href="${escapeAttr(props.href)}"${cls}${variantAttr} ${stamp}>${label}</a>`;
  }

  const type = props.type ?? "button";
  const disabled = props.disabled ? " disabled" : "";
  return `<button type="${escapeAttr(type)}"${cls}${variantAttr}${disabled} ${stamp}>${label}</button>`;
}

export function Button(
  props: ButtonProps & ButtonSlots & { children?: string } = {},
): string {
  const { children, label, ...rest } = props;
  return renderButton({
    props: rest,
    slots: { label },
    children,
  });
}
