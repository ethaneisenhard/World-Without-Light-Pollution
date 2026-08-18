/**
 * Text — body / lead / small / caption typography (BrowserUI text).
 */

import { componentStamp, stampSlotAttrs } from "../../inspect-stamp.js";

export type TextAs = "p" | "span" | "div";
export type TextVariant = "lead" | "body" | "small" | "caption";
export type TextAlign = "left" | "center" | "right" | "justify";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextColor = "ink" | "muted" | "brand" | "inherit";

export type TextProps = {
  as?: TextAs;
  variant?: TextVariant;
  align?: TextAlign;
  weight?: TextWeight;
  color?: TextColor;
  italic?: boolean;
  underline?: boolean;
  className?: string;
  instanceId?: string;
};

export type TextSlots = {
  content?: string;
};

export type TextRenderInput = {
  props?: TextProps;
  slots?: TextSlots;
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

const VARIANT_CLASS: Record<TextVariant, string> = {
  lead: "text-lg md:text-xl leading-relaxed",
  body: "text-base leading-relaxed",
  small: "text-sm leading-normal",
  caption: "text-xs leading-normal tracking-wide",
};

const ALIGN_CLASS: Record<TextAlign, string> = {
  left: "",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

const WEIGHT_CLASS: Record<TextWeight, string> = {
  normal: "",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const COLOR_CLASS: Record<TextColor, string> = {
  ink: "text-ink",
  muted: "text-ink-soft",
  brand: "text-accent",
  inherit: "",
};

export function renderText(
  input: TextRenderInput | (TextProps & TextSlots) = {},
): string {
  let props: TextProps;
  let slots: TextSlots;
  let children: string | undefined;

  if ("props" in input || "slots" in input || "children" in input) {
    const r = input as TextRenderInput;
    props = r.props ?? {};
    slots = r.slots ?? {};
    children = r.children;
  } else {
    const flat = input as TextProps & TextSlots;
    props = {
      as: flat.as,
      variant: flat.variant,
      align: flat.align,
      weight: flat.weight,
      color: flat.color,
      italic: flat.italic,
      underline: flat.underline,
      className: flat.className,
      instanceId: flat.instanceId,
    };
    slots = { content: flat.content };
  }

  const tag = props.as ?? "p";
  const variant = props.variant ?? "body";
  const align = props.align ?? "left";
  const weight = props.weight ?? "normal";
  const color = props.color ?? "ink";
  const raw = children ?? slots.content ?? "Text";
  const looksHtml = /<[a-z][\s\S]*>/i.test(raw);
  const textHtml = looksHtml ? raw : escapeHtml(raw);

  const stamp = componentStamp({
    componentId: "text",
    instanceId: props.instanceId,
  });
  const slotStamp = stampSlotAttrs({
    componentId: "text",
    slot: "content",
    instanceId: props.instanceId,
  });

  const cls = [
    VARIANT_CLASS[variant],
    ALIGN_CLASS[align],
    WEIGHT_CLASS[weight],
    COLOR_CLASS[color],
    props.italic ? "italic" : "",
    props.underline ? "underline underline-offset-2" : "",
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<${tag} class="${escapeAttr(cls)}" ${stamp}><span ${slotStamp}>${textHtml}</span></${tag}>`;
}

export function Text(
  props: TextProps & TextSlots & { children?: string } = {},
): string {
  const { children, content, ...rest } = props;
  return renderText({ props: rest, slots: { content }, children });
}
