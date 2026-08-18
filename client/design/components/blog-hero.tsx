/** @jsxImportSource remix/ui */
import { type Handle } from "remix/ui";
import {
  inspectComponentAttrs,
  inspectSlotAttrs,
} from "../inspect-attrs.ts";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type BlogHeroLayout = "magazine" | "side" | "backdrop";

/** Component-specific knobs. */
export type BlogHeroProps = {
  layout?: BlogHeroLayout;
  instanceId?: string;
  source?: string;
};

/** Named holes for primitives / components. */
export type BlogHeroSlots = {
  eyebrow?: JSX.Element;
  title?: JSX.Element;
  subtitle?: JSX.Element;
  byline?: JSX.Element;
  ctaPrimary?: JSX.Element;
  ctaSecondary?: JSX.Element;
  cover?: JSX.Element;
};

export type BlogHeroHandleProps = BlogHeroProps & {
  slots?: BlogHeroSlots;
  children?: JSX.Element;
};

function Slot(props: {
  name: string;
  instanceId?: string;
  class?: string;
  children?: JSX.Element;
}) {
  if (!props.children) return null;
  return (
    <div
      class={props.class}
      {...inspectSlotAttrs({
        componentId: "blog-hero",
        slot: props.name,
        instanceId: props.instanceId,
      })}
    >
      {props.children}
    </div>
  );
}

/**
 * remix/ui blog-hero — lives as children of Container in Live compose.
 * Landmark <section> + data-as-component="blog-hero" — never <header>.
 */
export function BlogHero(handle: Handle<BlogHeroHandleProps>) {
  return () => {
    const {
      layout = "magazine",
      instanceId,
      source,
      slots = {},
    } = handle.props;
    const {
      eyebrow,
      title,
      subtitle,
      byline,
      ctaPrimary,
      ctaSecondary,
      cover,
    } = slots;

    // No band fill / max-width / page gutters — section owns band + sides;
    // container owns max-width. This composite = slots + layout knobs only.
    const backdrop =
      layout === "backdrop"
        ? "min-h-[min(70vh,36rem)] flex flex-col justify-center"
        : "";
    const grid =
      layout === "side"
        ? "grid items-center gap-10 md:grid-cols-[1.1fr_1fr]"
        : "";
    const copyAlign =
      layout === "side"
        ? "items-start text-left"
        : "items-center text-center";
    const actionsAlign =
      layout === "side" ? "justify-start" : "justify-center";

    return (
      <section
        class="relative w-full overflow-hidden text-ink"
        {...inspectComponentAttrs({
          componentId: "blog-hero",
          instanceId,
          source,
        })}
        data-layout={layout}
      >
        <div class={cn("relative", backdrop, grid)}>
          <div class={cn("flex flex-col gap-5", copyAlign)}>
            <Slot name="eyebrow" instanceId={instanceId}>
              {eyebrow}
            </Slot>
            <Slot name="title" instanceId={instanceId}>
              {title}
            </Slot>
            <Slot name="subtitle" instanceId={instanceId}>
              {subtitle}
            </Slot>
            <Slot name="byline" instanceId={instanceId}>
              {byline}
            </Slot>
            {ctaPrimary || ctaSecondary ? (
              <div
                class={cn(
                  "mt-4 flex flex-wrap items-center gap-4",
                  actionsAlign,
                )}
              >
                <Slot name="ctaPrimary" instanceId={instanceId} class="contents">
                  {ctaPrimary}
                </Slot>
                <Slot
                  name="ctaSecondary"
                  instanceId={instanceId}
                  class="contents"
                >
                  {ctaSecondary}
                </Slot>
              </div>
            ) : null}
          </div>
          {layout === "magazine" && cover ? (
            <div class="mt-10">
              <Slot name="cover" instanceId={instanceId}>
                {cover}
              </Slot>
            </div>
          ) : null}
          {layout === "side" && cover ? (
            <div class="order-first md:order-last">
              <Slot name="cover" instanceId={instanceId}>
                {cover}
              </Slot>
            </div>
          ) : null}
        </div>
      </section>
    );
  };
}
