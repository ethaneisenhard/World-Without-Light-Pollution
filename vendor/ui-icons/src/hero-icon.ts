/**
 * Resolve a Heroicon by kebab-case name (BrowserUI / heroicons.com style).
 *
 * Prefer named deep imports for tree-shaking:
 *   import { ComputerDesktopIcon } from "@glassbox-studio/ui-icons/24/outline/computer-desktop";
 *
 * `heroIcon()` loads the full catalog — fine for dynamic/CMS names, heavy for chrome.
 */
import type { IconFactory } from "./create-icon.tsx";
import type { IconProps, IconVariant } from "./types.ts";
import * as outline from "./24/outline.ts";
import * as solid from "./24/solid.ts";

function kebabToPascalIcon(name: string): string {
  return (
    name
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("") + "Icon"
  );
}

export function heroIcon(
  name: string,
  props: IconProps & { variant?: IconVariant } = {},
) {
  const { variant = "outline", ...iconProps } = props;
  const exportName = kebabToPascalIcon(name);
  const pack = variant === "solid" ? solid : outline;
  const Icon = (pack as Record<string, IconFactory>)[exportName];
  if (!Icon) {
    throw new Error(`Unknown Heroicon "${name}" (${variant})`);
  }
  return Icon(iconProps);
}
