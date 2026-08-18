/**
 * Container — max-width shell only.
 * Flow lives on Flex / Grid. Align = horizontal placement of the width box.
 * Tag: <div> (not a landmark) + data-as-component="container".
 *
 * Taste (layout.mdc): do NOT put page-band backgrounds or side
 * gutters here — Section owns band color + px/py. Container = width only.
 * If a filled inset surface is needed, pair bg with border + radius + padding
 * (or use Section for the band).
 */

import { componentStamp } from "../../inspect-stamp.js";
import {
  type LayoutChrome,
  layoutRootClass,
  wrapLayoutChildren,
} from "../layout-shell.js";

export type ContainerWidth = "sm" | "md" | "lg" | "xl" | "full";
export type ContainerAlign = "left" | "center";

export type ContainerProps = {
  width?: ContainerWidth;
  align?: ContainerAlign;
  instanceId?: string;
};

export type ContainerSlots = Record<string, never>;

const CONTAINER_WIDTH: Record<ContainerWidth, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "w-full max-w-none",
};

export type ContainerRenderInput = {
  props?: ContainerProps;
  slots?: ContainerSlots;
  children?: string;
  chrome?: LayoutChrome;
};

export function renderContainer(
  input: ContainerRenderInput | ContainerProps = {},
): string {
  const normalized: ContainerRenderInput =
    "props" in input || "slots" in input || "children" in input || "chrome" in input
      ? (input as ContainerRenderInput)
      : { props: input as ContainerProps };

  const { width = "xl", align = "center", instanceId } = normalized.props ?? {};
  const chrome = normalized.chrome ?? "live";
  const children =
    normalized.children ??
    `<p class="text-sm text-ink-soft leading-relaxed">Container content</p>`;

  const cls = [
    layoutRootClass(chrome),
    "w-full",
    align === "center" ? "mx-auto" : "",
    CONTAINER_WIDTH[width],
  ]
    .filter(Boolean)
    .join(" ");

  const stamp = componentStamp({ componentId: "container", instanceId });
  return `<div class="${cls}" ${stamp}>${wrapLayoutChildren(children, chrome)}</div>`;
}

export function Container(
  props: ContainerProps & { children?: string } = {},
): string {
  const { children, ...rest } = props;
  return renderContainer({ props: rest, children });
}
