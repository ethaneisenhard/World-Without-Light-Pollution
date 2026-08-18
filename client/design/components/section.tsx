/** @jsxImportSource remix/ui */
import { type Handle } from "remix/ui";
import {
  LAYOUT_SHELL_CHILDREN_CLASS,
  LAYOUT_SHELL_ROOT_CLASS,
} from "-studio/components";
import { inspectComponentAttrs } from "../inspect-attrs.ts";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type SectionBackground =
  | "transparent"
  | "muted"
  | "brand"
  | "surface"
  | "dark";
export type SectionPadding = "none" | "sm" | "md" | "lg" | "xl";
export type SectionGap = "none" | "xs" | "sm" | "md" | "lg";

export type SectionProps = {
  background?: SectionBackground;
  padding?: SectionPadding;
  gap?: SectionGap;
  instanceId?: string;
};

export type SectionSlots = Record<string, never>;

export type SectionHandleProps = SectionProps & {
  slots?: SectionSlots;
  children?: JSX.Element;
};

const SECTION_PAD: Record<SectionPadding, string> = {
  none: "",
  sm: "py-6",
  md: "py-10",
  lg: "py-16",
  xl: "py-24",
};

const SECTION_GAP: Record<SectionGap, string> = {
  none: "",
  xs: "flex flex-col gap-2",
  sm: "flex flex-col gap-4",
  md: "flex flex-col gap-6",
  lg: "flex flex-col gap-8",
};

const SECTION_BG: Record<SectionBackground, string> = {
  transparent: "",
  muted: "bg-sand text-ink",
  brand: "bg-accent text-inverse-fg",
  surface: "bg-paper-raised text-ink",
  dark: "bg-paper-raised text-ink",
};

/** remix/ui — page band shell. Flow via Flex/Grid. */
export function Section(handle: Handle<SectionHandleProps>) {
  return () => {
    const {
      background = "transparent",
      padding = "lg",
      gap = "none",
      instanceId,
      children,
    } = handle.props;
    return (
      <section
        class={cn(
          LAYOUT_SHELL_ROOT_CLASS,
          SECTION_PAD[padding],
          SECTION_GAP[gap],
          SECTION_BG[background],
        )}
        {...inspectComponentAttrs({
          componentId: "section",
          instanceId,
        })}
        data-as-layout-shell="section"
      >
        <div
          class={LAYOUT_SHELL_CHILDREN_CLASS}
          data-as-layout-shell-children
        >
          {children ?? (
            <p class="text-sm leading-relaxed text-ink-soft">Section content</p>
          )}
        </div>
      </section>
    );
  };
}
