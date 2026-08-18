/** Live preview viewport switcher icons (outline idle / solid active). */
import type { IconProps } from "./types.ts";
import { ComputerDesktopIcon } from "./24/outline/computer-desktop.ts";
import { DeviceTabletIcon } from "./24/outline/device-tablet.ts";
import { DevicePhoneMobileIcon } from "./24/outline/device-phone-mobile.ts";
import { ViewColumnsIcon } from "./24/outline/view-columns.ts";
import { ComputerDesktopIcon as ComputerDesktopSolid } from "./24/solid/computer-desktop.ts";
import { DeviceTabletIcon as DeviceTabletSolid } from "./24/solid/device-tablet.ts";
import { DevicePhoneMobileIcon as DevicePhoneMobileSolid } from "./24/solid/device-phone-mobile.ts";
import { ViewColumnsIcon as ViewColumnsSolid } from "./24/solid/view-columns.ts";

const VIEWPORT_ICONS = {
  desktop: { outline: ComputerDesktopIcon, solid: ComputerDesktopSolid },
  tablet: { outline: DeviceTabletIcon, solid: DeviceTabletSolid },
  mobile: { outline: DevicePhoneMobileIcon, solid: DevicePhoneMobileSolid },
  all: { outline: ViewColumnsIcon, solid: ViewColumnsSolid },
} as const;

export type ViewportIconMode = keyof typeof VIEWPORT_ICONS;

const DEFAULT_PROPS: IconProps = { class: "size-5 shrink-0 text-current" };

export function viewportIcon(
  mode: ViewportIconMode,
  active: boolean,
  props: IconProps = DEFAULT_PROPS,
) {
  const pair = VIEWPORT_ICONS[mode];
  const Icon = active ? pair.solid : pair.outline;
  return Icon({ ...DEFAULT_PROPS, ...props });
}
