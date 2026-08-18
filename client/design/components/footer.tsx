/** @jsxImportSource remix/ui */
import { type Handle } from "remix/ui";
import {
  inspectComponentAttrs,
  inspectSlotAttrs,
} from "../inspect-attrs.ts";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type FooterVariant = "transparent" | "muted" | "surface";
export type FooterBorderTop = "off" | "on";

export type FooterProps = {
  variant?: FooterVariant;
  borderTop?: FooterBorderTop;
  className?: string;
  instanceId?: string;
};

export type FooterSlots = {
  brand?: JSX.Element;
  columns?: JSX.Element;
  bottom?: JSX.Element;
};

export type FooterHandleProps = FooterProps & {
  slots?: FooterSlots;
};

/**
 * remix/ui Footer — matches BrowserUI + SSR renderFooter.
 */
export function Footer(handle: Handle<FooterHandleProps>) {
  return () => {
    const {
      variant = "transparent",
      borderTop = "off",
      className = "",
      instanceId,
      slots = {},
    } = handle.props;
    const { brand, columns, bottom } = slots;

    const rootClass = cn(
      variant === "muted" && "bg-sand text-ink",
      variant === "surface" && "bg-paper-raised text-ink",
      variant === "transparent" && "w-full text-ink",
      borderTop === "on" && "border-t border-line",
      className,
    );

    const hasTop = Boolean(brand || columns);

    return (
      <footer
        class={rootClass}
        {...inspectComponentAttrs({
          componentId: "footer",
          instanceId,
        })}
      >
        {hasTop || bottom ? (
          <div class="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-12">
            {hasTop ? (
              <div class="grid w-full gap-10 md:grid-cols-12">
                {brand ? (
                  <div
                    class="md:col-span-4"
                    {...inspectSlotAttrs({
                      componentId: "footer",
                      slot: "brand",
                      instanceId,
                    })}
                  >
                    {brand}
                  </div>
                ) : null}
                {columns ? (
                  <div
                    class="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-3"
                    {...inspectSlotAttrs({
                      componentId: "footer",
                      slot: "columns",
                      instanceId,
                    })}
                  >
                    {columns}
                  </div>
                ) : null}
              </div>
            ) : null}
            {bottom ? (
              <div
                class={cn(
                  "mt-10 flex w-full flex-col items-start gap-3 pt-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between",
                  hasTop && "border-t border-line",
                )}
                {...inspectSlotAttrs({
                  componentId: "footer",
                  slot: "bottom",
                  instanceId,
                })}
              >
                {bottom}
              </div>
            ) : null}
          </div>
        ) : null}
      </footer>
    );
  };
}
