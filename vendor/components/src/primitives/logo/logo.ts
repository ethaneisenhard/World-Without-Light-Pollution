/** Logo primitive. */

import { glassBoxMarkSvgHtml } from "@glassbox-studio/ui-icons/ssr";
import { componentStamp, stampSlotAttrs } from "../../inspect-stamp.js";
import { escapeAttr, escapeHtml, htmlOrText } from "../../ssr-escape.js";

export type LogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  instanceId?: string;
  /** row = mark | wordmark; stack = mark above wordmark (auth cards). */
  layout?: "row" | "stack";
  /**
   * Mark face:
   * - glass-box-mark — GlassBoxMarkIcon SSR twin (SiteLogo default; design-system mark)
   * - initials — letter circle (Logo primitive default; Design atlas / custom brands)
   * - glass-box-splash — host for `/glass-box-splash/mount.js` (loading cube)
   * - image — `<img>` from `markSrc` (arbitrary assets only — never Glass Box brand mark)
   */
  markVariant?: "initials" | "glass-box-splash" | "glass-box-mark" | "image";
  /** Image URL when `markVariant` is `image` (required for image; not the brand mark). */
  markSrc?: string;
  /** Initials fallback text when markVariant is initials. */
  initials?: string;
};

export type LogoSlots = { mark?: string; wordmark?: string };
export type LogoRenderInput = {
  props?: LogoProps;
  slots?: LogoSlots;
  children?: string;
};

const SIZE_CLASS: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "gap-2 text-sm",
  md: "gap-3 text-base",
  lg: "gap-4 text-lg",
  xl: "gap-3 text-base",
};

const MARK_SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-20",
  /** Auth gate mark — square host; splash `frame:"mark"` crops cube to fill it. */
  xl: "size-[100px] aspect-square",
};

function defaultInitials(wordmark: string): string {
  const parts = wordmark.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return wordmark.slice(0, 2).toUpperCase() || "A";
}

function renderMarkHtml(input: {
  props: LogoProps;
  slots: LogoSlots;
  wordmark: string;
  markStamp: string;
}): string {
  const { props, slots, wordmark, markStamp } = input;
  const variant = props.markVariant ?? "initials";
  const markSize = MARK_SIZE[props.size ?? "md"];

  switch (variant) {
    case "glass-box-splash": {
      const fallback =
        typeof slots.mark === "string" && slots.mark.trim()
          ? slots.mark
          : `<img class="${escapeAttr(`${markSize} object-contain opacity-90`)}" src="/glass-box-splash/mark.svg" width="100" height="100" alt="" decoding="async" data-as-glass-box-auth-fallback="1" />`;
      return `<span class="${escapeAttr(`relative block shrink-0 overflow-hidden ${markSize}`)}" data-as-glass-box-auth-mark="1" data-as-glass-box-frame="mark" aria-hidden="true" ${markStamp}>${fallback}</span>`;
    }
    case "glass-box-mark": {
      const idPrefix = `logo-gb-${props.instanceId ?? "mark"}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "",
      );
      const svg = glassBoxMarkSvgHtml({
        className: `${markSize} shrink-0`,
        idPrefix,
      });
      return `<span class="${escapeAttr(`inline-flex ${markSize} items-center justify-center`)}" ${markStamp}>${svg}</span>`;
    }
    case "image": {
      const src = typeof props.markSrc === "string" ? props.markSrc.trim() : "";
      if (!src) {
        // Brand mark must use GlassBoxMarkIcon path — never silent img fallback.
        return renderMarkHtml({
          props: { ...props, markVariant: "glass-box-mark" },
          slots,
          wordmark,
          markStamp,
        });
      }
      return `<span class="${escapeAttr(`inline-flex ${markSize} items-center justify-center`)}" ${markStamp}><img class="${escapeAttr(`${markSize} object-contain`)}" src="${escapeAttr(src)}" alt="" decoding="async" /></span>`;
    }
    case "initials":
    default: {
      if (typeof slots.mark === "string" && slots.mark.trim()) {
        return `<span class="${escapeAttr(`inline-flex ${markSize} items-center justify-center rounded-full bg-accent text-sm text-inverse-fg`)}" ${markStamp}>${htmlOrText(slots.mark)}</span>`;
      }
      const initials =
        (typeof props.initials === "string" && props.initials.trim()) ||
        defaultInitials(wordmark);
      return `<span class="${escapeAttr(`inline-flex ${markSize} items-center justify-center rounded-full bg-accent text-sm font-bold tracking-tight text-inverse-fg`)}" ${markStamp} aria-hidden="true">${escapeHtml(initials)}</span>`;
    }
  }
}

export function renderLogo(
  input: LogoRenderInput | LogoProps = {},
): string {
  const normalized =
    "props" in input || "slots" in input || "children" in input
      ? (input as LogoRenderInput)
      : { props: input as LogoProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({
    componentId: "logo",
    instanceId: props.instanceId,
  });
  const markStamp = stampSlotAttrs({
    componentId: "logo",
    slot: "mark",
    instanceId: props.instanceId,
  });
  const wordmarkStamp = stampSlotAttrs({
    componentId: "logo",
    slot: "wordmark",
    instanceId: props.instanceId,
  });
  const wordmark = String(
    normalized.children ?? slots.wordmark ?? "Glass Box Studio",
  );
  const layout = props.layout ?? "row";
  const layoutClass =
    layout === "stack"
      ? "flex flex-col items-center text-center"
      : "inline-flex items-center";
  const cls = [
    layoutClass,
    "font-semibold text-ink",
    SIZE_CLASS[props.size ?? "md"],
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const mark = renderMarkHtml({ props, slots, wordmark, markStamp });
  const wordmarkHtml = wordmark.trim()
    ? `<span ${wordmarkStamp}>${htmlOrText(wordmark)}</span>`
    : "";
  return `<span class="${escapeAttr(cls)}" ${stamp}>${mark}${wordmarkHtml}</span>`;
}

export function Logo(
  props: LogoProps & LogoSlots & { children?: string } = {},
): string {
  const { children, mark, wordmark, ...rest } = props;
  return renderLogo({
    props: rest,
    slots: { mark, wordmark },
    children,
  });
}
