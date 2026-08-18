/** @jsxImportSource remix/ui */
import { type Handle } from "remix/ui";
import {
  inspectComponentAttrs,
  inspectSlotAttrs,
} from "../inspect-attrs.ts";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonType = "button" | "submit" | "reset";

export type ButtonHandleProps = {
  variant?: ButtonVariant;
  href?: string;
  type?: ButtonType;
  disabled?: boolean;
  className?: string;
  label?: string;
  instanceId?: string;
  children?: JSX.Element;
};

/**
 * remix/ui Button — headless. Project passes Tailwind via className.
 */
export function Button(handle: Handle<ButtonHandleProps>) {
  return () => {
    const {
      variant = "primary",
      href,
      type = "button",
      disabled = false,
      className = "",
      label = "Button",
      instanceId,
      children,
    } = handle.props;

    const content = children ?? (
      <span
        {...inspectSlotAttrs({
          componentId: "button",
          slot: "label",
          instanceId,
        })}
      >
        {label}
      </span>
    );

    const rootAttrs = inspectComponentAttrs({
      componentId: "button",
      instanceId,
    });

    if (href) {
      return (
        <a href={href} class={className} data-variant={variant} {...rootAttrs}>
          {content}
        </a>
      );
    }

    return (
      <button
        type={type}
        class={className}
        data-variant={variant}
        disabled={disabled || undefined}
        {...rootAttrs}
      >
        {content}
      </button>
    );
  };
}
