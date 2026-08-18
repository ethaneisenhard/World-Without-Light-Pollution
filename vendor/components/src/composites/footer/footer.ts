/**
 * Footer composite — BrowserUI marketing footer shape.
 * brand column | link columns | bottom bar.
 * Default variant transparent — wrapping section owns the band.
 */

import { componentStamp, stampSlotAttrs } from "../../inspect-stamp.js";
import { escapeAttr, htmlOrText } from "../../ssr-escape.js";

export type FooterProps = {
  /** Band fill — prefer transparent + section band on Live pages. */
  variant?: "transparent" | "muted" | "surface";
  borderTop?: "off" | "on";
  className?: string;
  instanceId?: string;
};

export type FooterSlots = {
  brand?: string;
  columns?: string;
  bottom?: string;
};

export type FooterRenderInput = {
  props?: FooterProps;
  slots?: FooterSlots;
  children?: string;
};

function variantClass(variant: FooterProps["variant"]): string {
  if (variant === "muted") return "bg-sand text-ink";
  if (variant === "surface") return "bg-paper-raised text-ink";
  return "w-full text-ink";
}

export function renderFooter(
  input: FooterRenderInput | FooterProps = {},
): string {
  const normalized =
    "props" in input || "slots" in input || "children" in input
      ? (input as FooterRenderInput)
      : { props: input as FooterProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({
    componentId: "footer",
    instanceId: props.instanceId,
  });
  const variant = props.variant ?? "transparent";
  const border = props.borderTop === "on" ? "border-t border-line" : "";
  const cls = [variantClass(variant), border, props.className ?? ""]
    .filter(Boolean)
    .join(" ");

  const brand = slots.brand?.trim()
    ? `<div class="md:col-span-4" ${stampSlotAttrs({ componentId: "footer", slot: "brand", instanceId: props.instanceId })}>${slots.brand}</div>`
    : "";

  const columns = slots.columns?.trim()
    ? `<div class="grid gap-8 md:col-span-8 grid-cols-2 md:grid-cols-3" ${stampSlotAttrs({ componentId: "footer", slot: "columns", instanceId: props.instanceId })}>${slots.columns}</div>`
    : "";

  const top =
    brand || columns
      ? `<div class="grid w-full gap-10 md:grid-cols-12">${brand}${columns}</div>`
      : "";

  const bottom = slots.bottom?.trim()
    ? `<div class="mt-10 flex w-full flex-col items-start gap-3 pt-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between ${top ? "border-t border-line" : ""}" ${stampSlotAttrs({ componentId: "footer", slot: "bottom", instanceId: props.instanceId })}>${htmlOrText(slots.bottom)}</div>`
    : "";

  const inner =
    top || bottom
      ? `<div class="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-12">${top}${bottom}</div>`
      : "";

  return `<footer class="${escapeAttr(cls)}" ${stamp}>${inner}</footer>`;
}

export function Footer(
  props: FooterProps & FooterSlots & { children?: string } = {},
): string {
  const { children, brand, columns, bottom, ...rest } = props;
  return renderFooter({
    props: rest,
    slots: { brand, columns, bottom },
    children,
  });
}
