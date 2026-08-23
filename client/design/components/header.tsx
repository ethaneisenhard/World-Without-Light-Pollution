/** @jsxImportSource remix/ui */
import { type Handle } from "remix/ui";
import { Bars3Icon } from "@glassbox-studio/ui-icons/24/outline/bars-3";
import { XMarkIcon } from "@glassbox-studio/ui-icons/24/outline/x-mark";
import {
  inspectComponentAttrs,
  inspectSlotAttrs,
} from "../inspect-attrs.ts";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type HeaderSticky = "off" | "on";
export type HeaderTransparent = "off" | "on";
export type HeaderBorderBottom = "off" | "on";

export type HeaderProps = {
  sticky?: HeaderSticky;
  transparent?: HeaderTransparent;
  borderBottom?: HeaderBorderBottom;
  className?: string;
  instanceId?: string;
};

export type HeaderSlots = {
  brand?: JSX.Element;
  nav?: JSX.Element;
  actions?: JSX.Element;
};

export type HeaderHandleProps = HeaderProps & {
  slots?: HeaderSlots;
};

/**
 * remix/ui Site Header — matches BrowserUI + SSR renderHeader.
 * md+: brand | nav | actions. Narrow: hamburger <details> panel.
 */
export function Header(handle: Handle<HeaderHandleProps>) {
  return () => {
    const {
      sticky = "off",
      transparent = "off",
      borderBottom = "on",
      className = "",
      instanceId,
      slots = {},
    } = handle.props;
    const { brand, nav, actions } = slots;
    const isTransparent = transparent === "on";

    const rootClass = cn(
      "w-full",
      sticky === "on" ? "sticky top-0 z-40" : "relative",
      isTransparent
        ? "bg-transparent text-ink"
        : "bg-paper/95 text-ink backdrop-blur",
      !isTransparent && borderBottom !== "off" && "border-b border-line",
      className,
    );

    const rootAttrs = inspectComponentAttrs({
      componentId: "header",
      instanceId,
    });

    return (
      <header class={rootClass} {...rootAttrs}>
        <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 md:gap-8">
          {brand ? (
            <div
              class="min-w-0"
              {...inspectSlotAttrs({
                componentId: "header",
                slot: "brand",
                instanceId,
              })}
            >
              {brand}
            </div>
          ) : null}

          {nav ? (
            <nav
              class="hidden items-center gap-1 md:flex"
              aria-label="Primary"
              {...inspectSlotAttrs({
                componentId: "header",
                slot: "nav",
                instanceId,
              })}
            >
              {nav}
            </nav>
          ) : null}

          {actions ? (
            <div
              class="hidden items-center gap-2 md:flex"
              {...inspectSlotAttrs({
                componentId: "header",
                slot: "actions",
                instanceId,
              })}
            >
              {actions}
            </div>
          ) : null}

          {nav || actions ? (
            <details class="group/menu contents md:hidden">
              <summary
                class="list-none cursor-pointer select-none inline-flex size-10 items-center justify-center rounded-md text-ink-soft hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden"
                aria-label="Toggle navigation menu"
              >
                {Bars3Icon({
                  class: "size-6 group-open/menu:hidden",
                })}
                {XMarkIcon({
                  class: "hidden size-6 group-open/menu:block",
                })}
              </summary>
              <div class="absolute inset-x-0 top-full z-50 hidden border-t border-line bg-paper shadow-md group-open/menu:block">
                <nav
                  class="flex w-full flex-col gap-1 px-4 py-4"
                  aria-label="Mobile"
                >
                  {nav}
                  {actions ? (
                    <div class="mt-3 flex flex-col gap-2 border-t border-line px-3 pt-4">
                      {actions}
                    </div>
                  ) : null}
                </nav>
              </div>
            </details>
          ) : null}
        </div>
      </header>
    );
  };
}
