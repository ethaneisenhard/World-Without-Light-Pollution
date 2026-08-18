/**
 * Heading — typography primitive (BrowserUI heading, Glass Box Studio shape).
 * Semantic <h1>–<h6> + data-as-component="heading". Visuals via className / size props.
 */

import { componentStamp, stampSlotAttrs } from "../../inspect-stamp.js";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "display";
export type HeadingAlign = "left" | "center" | "right";
export type HeadingWeight = "normal" | "medium" | "semibold" | "bold";
export type HeadingColor = "ink" | "muted" | "brand" | "inherit";

export type HeadingProps = {
  level?: HeadingLevel;
  size?: HeadingSize;
  align?: HeadingAlign;
  weight?: HeadingWeight;
  color?: HeadingColor;
  italic?: boolean;
  className?: string;
  instanceId?: string;
};

export type HeadingSlots = {
  text?: string;
};

export type HeadingRenderInput = {
  props?: HeadingProps;
  slots?: HeadingSlots;
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

const SIZE_CLASS: Record<HeadingSize, string> = {
  xs: "text-base",
  sm: "text-lg",
  md: "text-xl md:text-2xl",
  lg: "text-2xl md:text-3xl lg:text-4xl",
  xl: "text-3xl md:text-4xl lg:text-5xl",
  display: "font-display text-5xl md:text-7xl leading-[1.05] tracking-tight",
};

const ALIGN_CLASS: Record<HeadingAlign, string> = {
  left: "",
  center: "text-center",
  right: "text-right",
};

const WEIGHT_CLASS: Record<HeadingWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const COLOR_CLASS: Record<HeadingColor, string> = {
  ink: "text-ink",
  muted: "text-ink-soft",
  brand: "text-accent",
  inherit: "",
};

export function renderHeading(
  input: HeadingRenderInput | (HeadingProps & HeadingSlots) = {},
): string {
  let props: HeadingProps;
  let slots: HeadingSlots;
  let children: string | undefined;

  if ("props" in input || "slots" in input || "children" in input) {
    const r = input as HeadingRenderInput;
    props = r.props ?? {};
    slots = r.slots ?? {};
    children = r.children;
  } else {
    const flat = input as HeadingProps & HeadingSlots;
    props = {
      level: flat.level,
      size: flat.size,
      align: flat.align,
      weight: flat.weight,
      color: flat.color,
      italic: flat.italic,
      className: flat.className,
      instanceId: flat.instanceId,
    };
    slots = { text: flat.text };
  }

  const level = (Number(props.level) || 1) as HeadingLevel;
  const size = props.size ?? "lg";
  const align = props.align ?? "left";
  const weight = props.weight ?? "bold";
  const color = props.color ?? "ink";
  const raw = children ?? slots.text ?? "Heading";
  const looksHtml = /<[a-z][\s\S]*>/i.test(raw);
  const textHtml = looksHtml ? raw : escapeHtml(raw);

  const stamp = componentStamp({
    componentId: "heading",
    instanceId: props.instanceId,
  });
  const slotStamp = stampSlotAttrs({
    componentId: "heading",
    slot: "text",
    instanceId: props.instanceId,
  });

  const cls = [
    "tracking-tight break-words",
    SIZE_CLASS[size],
    ALIGN_CLASS[align],
    WEIGHT_CLASS[weight],
    COLOR_CLASS[color],
    props.italic ? "italic" : "",
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<h${level} class="${escapeAttr(cls)}" ${stamp}><span ${slotStamp}>${textHtml}</span></h${level}>`;
}

export function Heading(
  props: HeadingProps & HeadingSlots & { children?: string } = {},
): string {
  const { children, text, ...rest } = props;
  return renderHeading({ props: rest, slots: { text }, children });
}
