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

export type ContainerWidth = "sm" | "md" | "lg" | "xl" | "full";
export type ContainerAlign = "left" | "center";

export type ContainerProps = {
  width?: ContainerWidth;
  align?: ContainerAlign;
  instanceId?: string;
};

export type ContainerSlots = Record<string, never>;

export type ContainerHandleProps = ContainerProps & {
  slots?: ContainerSlots;
  children?: JSX.Element;
};

const CONTAINER_WIDTH: Record<ContainerWidth, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "w-full max-w-none",
};

/** remix/ui — max-width shell. Flow via Flex/Grid. */
export function Container(handle: Handle<ContainerHandleProps>) {
  return () => {
    const { width = "xl", align = "center", instanceId, children } =
      handle.props;
    return (
      <div
        class={cn(
          LAYOUT_SHELL_ROOT_CLASS,
          "w-full",
          align === "center" && "mx-auto",
          CONTAINER_WIDTH[width],
        )}
        {...inspectComponentAttrs({
          componentId: "container",
          instanceId,
        })}
        data-as-layout-shell="container"
      >
        <div
          class={LAYOUT_SHELL_CHILDREN_CLASS}
          data-as-layout-shell-children
        >
          {children ?? (
            <p class="text-sm leading-relaxed text-ink-soft">
              Container content
            </p>
          )}
        </div>
      </div>
    );
  };
}
