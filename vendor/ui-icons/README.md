# `@glassbox-studio/ui-icons`

[Heroicons](https://heroicons.com/) as **remix/ui** SVG factories — no React.

Glyph JSON catalog ported from BrowserUI `@browserui/icons` (vendored from
Tailwind Heroicons v2.2.0).

## Usage

```tsx
import { ComputerDesktopIcon } from "@glassbox-studio/ui-icons/24/outline";
import { ComputerDesktopIcon as ComputerDesktopSolid } from "@glassbox-studio/ui-icons/24/solid";
import { heroIcon, viewportIcon } from "@glassbox-studio/ui-icons";

// Call as factories (remix Handle components are arity-based — don't use <Icon />):
{ComputerDesktopIcon({ class: "size-5" })}
{viewportIcon("tablet", active)}
{heroIcon("folder-open", { variant: "solid", class: "size-4" })}
```

| Import | What |
| --- | --- |
| `@glassbox-studio/ui-icons` | helpers + common chrome icons (tree-shake safe) |
| `@glassbox-studio/ui-icons/24/outline` | barrel of all outline factories (prefer deep path) |
| `@glassbox-studio/ui-icons/24/outline/star` | single icon — best for one-offs |
| `@glassbox-studio/ui-icons/24/solid` | solid barrel / deep paths |
| `@glassbox-studio/ui-icons/brand/glass-box-mark` | Glass Box Computers product mark (colored SVG factory) |

## Brand mark (design system)

**SoT:** `GlassBoxMarkIcon` — remix/ui factory. Geometry lives in
`glass-box-mark-geometry-pure.ts`. SSR twin: `glassBoxMarkSvgHtml` from
`@glassbox-studio/ui-icons/ssr` (Logo / SiteLogo / string HTML).

```tsx
import { GlassBoxMarkIcon } from "@glassbox-studio/ui-icons/brand/glass-box-mark";

{GlassBoxMarkIcon({ class: "size-7" })}
```

| Surface | Use |
| --- | --- |
| remix/ui JSX | `GlassBoxMarkIcon({ class })` |
| String HTML / Logo | `markVariant: "glass-box-mark"` (SiteLogo **default**) or `glassBoxMarkSvgHtml` |
| Boot / auth loading cube | `glass-box-splash` (separate animated host) |

**Never** paint the brand mark as `<img src="/icons/glassbox-mark.svg">` in chrome —
seams at small sizes; drifts from the design-system factory.

Product mark is a **brand exception** to Heroicons-only. Not the boot-splash wireframe.

## Sync

```bash
# Prefer sibling BrowserUI outline catalog; solid from @heroicons/react if present
pnpm --filter @glassbox-studio/ui-icons sync

BROWSERUI_ROOT=~/BrowserUI pnpm --filter @glassbox-studio/ui-icons sync
```
