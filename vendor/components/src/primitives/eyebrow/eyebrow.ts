/**
 * Eyebrow — small uppercase label above a heading (BrowserUI eyebrow).
 */

import { componentStamp, stampSlotAttrs } from "../../inspect-stamp.js";

export type EyebrowAlign = "left" | "center" | "right";
export type EyebrowColor = "ink" | "muted" | "brand";

export type EyebrowProps = {
  align?: EyebrowAlign;
  color?: EyebrowColor;
  className?: string;
  instanceId?: string;
};

export type EyebrowSlots = {
  text?: string;
};

export type EyebrowRenderInput = {
  props?: EyebrowProps;
  slots?: EyebrowSlots;
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

const ALIGN_CLASS: Record<EyebrowAlign, string> = {
  left: "",
  center: "w-full text-center",
  right: "w-full text-right",
};

const COLOR_CLASS: Record<EyebrowColor, string> = {
  ink: "text-ink",
  muted: "text-ink-soft",
  brand: "text-accent",
};

export function renderEyebrow(
  input: EyebrowRenderInput | (EyebrowProps & EyebrowSlots) = {},
): string {
  let props: EyebrowProps;
  let slots: EyebrowSlots;
  let children: string | undefined;

  if ("props" in input || "slots" in input || "children" in input) {
    const r = input as EyebrowRenderInput;
    props = r.props ?? {};
    slots = r.slots ?? {};
    children = r.children;
  } else {
    const flat = input as EyebrowProps & EyebrowSlots;
    props = {
      align: flat.align,
      color: flat.color,
      className: flat.className,
      instanceId: flat.instanceId,
    };
    slots = { text: flat.text };
  }

  const align = props.align ?? "left";
  const color = props.color ?? "muted";
  const raw = children ?? slots.text ?? "Eyebrow";
  const looksHtml = /<[a-z][\s\S]*>/i.test(raw);
  const textHtml = looksHtml ? raw : escapeHtml(raw);

  const stamp = componentStamp({
    componentId: "eyebrow",
    instanceId: props.instanceId,
  });
  const slotStamp = stampSlotAttrs({
    componentId: "eyebrow",
    slot: "text",
    instanceId: props.instanceId,
  });

  const cls = [
    "inline-block text-xs font-semibold uppercase tracking-[0.18em]",
    ALIGN_CLASS[align],
    COLOR_CLASS[color],
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<p class="${escapeAttr(cls)}" ${stamp}><span ${slotStamp}>${textHtml}</span></p>`;
}

export function Eyebrow(
  props: EyebrowProps & EyebrowSlots & { children?: string } = {},
): string {
  const { children, text, ...rest } = props;
  return renderEyebrow({ props: rest, slots: { text }, children });
}
