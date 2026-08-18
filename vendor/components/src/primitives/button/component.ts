import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

/**
 * Button — headless action.
 * props = variant / href / type · slot = label · className from compose (not inspector enum)
 */
export const meta = {
  id: "button",
  title: "Button",
  layer: "primitive",
  acceptsChildren: false,
  props: {
    variant: {
      type: "enum",
      values: ["primary", "secondary", "ghost"],
      default: "primary",
      title: "Variant",
      description: "Semantic role — style via Tailwind / data-variant",
    },
    type: {
      type: "enum",
      values: ["button", "submit", "reset"],
      default: "button",
      title: "Type",
      description: "Native button type (ignored when href is set at compose)",
    },
  },
  slots: {
    label: {
      title: "Label",
      description: "Button text",
    },
  },
} as const satisfies DesignComponentMeta;

export const slotTextDefaults = {
  label: "Button",
} as const;

export function slotsFromPlainText(
  text: Record<string, string>,
): Record<string, string> {
  return {
    label: text.label?.trim() || "Button",
  };
}

export type { ButtonProps, ButtonSlots } from "./button.js";
export { Button, renderButton } from "./button.js";
