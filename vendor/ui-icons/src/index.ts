/**
 * @glassbox-studio/ui-icons — Heroicons for remix/ui (no React).
 *
 * Glyph catalog ported from BrowserUI `@browserui/icons` (heroicons.com SVGs).
 *
 * @example
 * import { ComputerDesktopIcon } from "@glassbox-studio/ui-icons/24/outline";
 * import { viewportIcon, heroIcon } from "@glassbox-studio/ui-icons";
 *
 * // Call factories — do not use as remix Handle components:
 * {ComputerDesktopIcon({ class: "size-5" })}
 * {viewportIcon("desktop", true)}
 * {heroIcon("folder", { class: "size-4" })}
 */
export type { IconGlyph, IconProps, IconVariant } from "./types.ts";
export {
  createOutlineIcon,
  createSolidIcon,
  type IconFactory,
} from "./create-icon.tsx";
export { outlineIconSvg, solidIconSvg } from "./icon-svg.ts";
export {
  bars3OutlineSvg,
  moonOutlineSvg,
  xMarkOutlineSvg,
} from "./ssr.ts";
export { heroIcon } from "./hero-icon.ts";
export { viewportIcon, type ViewportIconMode } from "./viewport.ts";
export {
  HEROICONS_OUTLINE_NAMES,
  HEROICONS_SOLID_NAMES,
  HEROICONS_OUTLINE_COUNT,
  HEROICONS_SOLID_COUNT,
} from "./generated/heroicons/manifest.ts";

// Common chrome icons — prefer deep imports for one-offs:
//   import { StarIcon } from "@glassbox-studio/ui-icons/24/outline"
export { ComputerDesktopIcon } from "./24/outline/computer-desktop.ts";
export { DevicePhoneMobileIcon } from "./24/outline/device-phone-mobile.ts";
export { DeviceTabletIcon } from "./24/outline/device-tablet.ts";
export { ViewColumnsIcon } from "./24/outline/view-columns.ts";
export { FolderIcon } from "./24/outline/folder.ts";
export { FolderOpenIcon } from "./24/outline/folder-open.ts";
export { DocumentTextIcon } from "./24/outline/document-text.ts";
export { ChevronRightIcon } from "./24/outline/chevron-right.ts";
export { ChevronLeftIcon } from "./24/outline/chevron-left.ts";
export { CalendarIcon } from "./24/outline/calendar.ts";
export { PhotoIcon } from "./24/outline/photo.ts";
export { Cog6ToothIcon } from "./24/outline/cog-6-tooth.ts";
export { MagnifyingGlassIcon } from "./24/outline/magnifying-glass.ts";
export { XMarkIcon } from "./24/outline/x-mark.ts";
export { ArrowTopRightOnSquareIcon } from "./24/outline/arrow-top-right-on-square.ts";
export { MoonIcon } from "./24/outline/moon.ts";
export { Bars3Icon } from "./24/outline/bars-3.ts";
/** Product mark — prefer deep import `@glassbox-studio/ui-icons/brand/glass-box-mark`. */
export { GlassBoxMarkIcon } from "./brand/glass-box-mark.tsx";
