/**
 * Optimized image — sharp-backed srcset (WebP) via Studio media URLs.
 *
 * Prefer `media:<assetId>` hrefs; pass `apiOrigin` + `projectId` for Live.
 */

import { componentStamp, stampSlotAttrs } from "../../inspect-stamp.js";
import { escapeAttr } from "../../ssr-escape.js";
import {
  buildOptimizedSrcSet,
  resolveMediaImageUrl,
} from "@glassbox-studio/studio-core/browser";

export type OptimizedImageProps = {
  /** `media:id`, API path, or absolute URL */
  src: string;
  alt?: string;
  projectId?: string;
  apiOrigin?: string;
  widths?: number[];
  sizes?: string;
  loading?: "lazy" | "eager";
  className?: string;
  instanceId?: string;
  source?: string;
};

export type OptimizedImageSlots = { caption?: string };

export type OptimizedImageRenderInput = {
  props?: OptimizedImageProps;
  slots?: OptimizedImageSlots;
};

export function renderOptimizedImage(
  input: OptimizedImageRenderInput | OptimizedImageProps = {},
): string {
  const normalized =
    "props" in input || "slots" in input
      ? (input as OptimizedImageRenderInput)
      : { props: input as OptimizedImageProps };
  const props = normalized.props ?? { src: "" };
  const caption = normalized.slots?.caption ?? "";
  const src = props.src?.trim() ?? "";
  if (!src) {
    return `<div class="rounded-xl border border-line bg-sand ${escapeAttr(props.className ?? "")}" ${componentStamp({ componentId: "optimized-image", instanceId: props.instanceId })}></div>`;
  }
  const resolveOpts = {
    apiOrigin: props.apiOrigin,
    defaultProjectId: props.projectId,
  };
  const primary = resolveMediaImageUrl(src, {
    ...resolveOpts,
    transform: { width: 1200, format: "webp", quality: 82 },
  });
  const srcset = buildOptimizedSrcSet(src, {
    ...resolveOpts,
    widths: props.widths,
  });
  const sizes = props.sizes ?? "(max-width: 768px) 100vw, 720px";
  const stamp = componentStamp({
    componentId: "optimized-image",
    instanceId: props.instanceId,
    source: props.source,
  });
  const img = `<img src="${escapeAttr(primary)}" srcset="${escapeAttr(srcset)}" sizes="${escapeAttr(sizes)}" alt="${escapeAttr(props.alt ?? "")}" loading="${props.loading ?? "lazy"}" decoding="async" class="h-auto w-full max-w-full ${escapeAttr(props.className ?? "")}" ${stamp} />`;
  if (!caption) return img;
  const capStamp = stampSlotAttrs({
    componentId: "optimized-image",
    slot: "caption",
    instanceId: props.instanceId,
  });
  return `<figure class="space-y-2">${img}<figcaption class="text-sm text-ink-soft" ${capStamp}>${escapeAttr(caption)}</figcaption></figure>`;
}

export function OptimizedImage(
  props: OptimizedImageProps & OptimizedImageSlots = { src: "" },
): string {
  const { caption, ...rest } = props;
  return renderOptimizedImage({ props: rest, slots: { caption } });
}
