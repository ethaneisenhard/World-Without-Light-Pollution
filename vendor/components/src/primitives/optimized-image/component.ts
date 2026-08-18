import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";
export const meta = {
  id: "optimized-image",
  title: "Optimized image",
  layer: "primitive",
  acceptsChildren: false,
  props: {
    src: { type: "string", default: "", title: "Src (media:id or URL)" },
    alt: { type: "string", default: "", title: "Alt" },
    loading: {
      type: "enum",
      values: ["lazy", "eager"],
      default: "lazy",
      title: "Loading",
    },
  },
  slots: {
    caption: { title: "Caption", optional: true },
  },
} as const satisfies DesignComponentMeta;
export const slotTextDefaults = { caption: "" } as const;
export function slotsFromPlainText(
  text: Record<string, string>,
): Record<string, string> {
  return { caption: text.caption?.trim() || "" };
}
export type { OptimizedImageProps, OptimizedImageSlots } from "./optimized-image.js";
export { OptimizedImage, renderOptimizedImage } from "./optimized-image.js";
