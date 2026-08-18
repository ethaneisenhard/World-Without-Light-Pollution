# ADR 0007 — CSS document flow (general practice + Studio policy)

## Status

Accepted (amended 2026-07-16 — ban `w-full` / `h-full`; flex only when a parent needs layout control)

**Amended 2026-07-16 (evening)** — hard Must/Must-not laws grounded in CSS (containing block, flex `min-size: auto`, overflow → scrollport, button intrinsic sizing). Ban content `grid` / `contain-inline-size` as layout escape hatches. Encode truncation + pane recipes.

**Amended 2026-07-16 (night)** — Split **general CSS/Tailwind practice** (Studio + ideal-stack) from **Studio chrome policy** (`apps/studio/**`). Align carve-outs with MDN / Flexbox §4.5 / Chrome modern-web-guidance: overflow ≡ `min-width: 0`; grid = 2D skeletons (not shell-only everywhere); `container-type` OK for CQ; `min-w-0` last resort when overflow would clip; `w-full` OK for media + `aspect-ratio`.

## Context

Studio chrome accumulated layout escape hatches — `min-w-0`, `min-h-0`, leaf `max-w-*`, **`h-full` / `w-full`**, nested **`flex` / `flex-col` on every wrapper**, and later agent “fixes” like **content `grid-cols-1`** or **`contain-inline-size`** to force narrow-rail truncation. Those fight the **CSS formatting model**.

Research against MDN, CSS Flexbox, and [Google Chrome modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/css-layout/css-layout.md) showed:

| Ours | Web |
| --- | --- |
| Overflow-on-flex-child for shrink | Spec-legal (overflow ≠ `visible` → auto min size 0); industry also documents `min-width: 0` |
| Grid = shell only (hard) | Too strict — 2D component grids are valid |
| Ban all `contain-inline-size` | Must not forbid **container queries** (`container-type: inline-size`) |
| Ban all `w-full` | Media + `aspect-ratio` often needs percentage width |

Product intent: **one shared CSS/Tailwind practice** for Studio + ideal-stack, plus a **Studio-only stricter policy** so agents stop inventing escape hatches in rails/chat.

Canonical agent rule: `.cursor/rules/design/natural-document-flow.mdc`.

## Decision

### Audience

| Surface | Follows |
| --- | --- |
| Ideal-stack (`projects/*`) | **General practice** (Laws G1–G10) |
| Studio chrome (`apps/studio/**`) | General practice **+ Studio policy** (S1–S5) |

### General practice (summary)

1. Default normal flow; sparse flex/grid.
2. One layout parent per concern.
3. Pane recipe: `flex-col overflow-hidden` + one `flex-1 overflow-y-auto` scroll leaf.
4. Overflow / min-size placement surgical — either overflow on the flex child **or** `min-w-0` / `min-inline-size: 0` (both valid per Flexbox §4.5).
5. Truncation: flex item + shrink path + `truncate` — not content `grid-cols-1` / `contain-*` hacks.
6. **Grid = 2D track skeletons** (page **or** component) — never grid to fake 1D truncate/fill.
7. Fill with `flex-1` / `1fr`; `w-full` OK for replaced media + `aspect-ratio`.
8. Sticky: know the scrollport; list section headers prefer no margin on sticky.
9. Semantic HTML first.
10. No escape-hatch creativity; **CQ `container-type` remains OK**.

### Studio chrome policy (summary)

| Id | Policy |
| --- | --- |
| **S1** | Prefer overflow-on-flex-child; `min-w-0` only when shrink is needed **and** overflow would clip overlays |
| **S2** | Product chrome grid is shell-first; no content grid in chat/rails/settings lists |
| **S3** | No `w-full`/`h-full` as pane fill |
| **S4** | Sticky list headers: no margin |
| **S5** | DeskPane / no-`!important` shell twins apply |

Existing debt — remove when touching; do not spread.

## Consequences

| Do | Don't |
| --- | --- |
| Treat ideal-stack under **general** laws | Force Studio `min-w-0` ban onto marketing pages |
| Studio rails: overflow truncate recipe | Content `grid-cols-1` / `contain-inline-size` for ellipsis |
| Use `@container` for pane queries | Confuse CQ containment with truncate hacks |
| Component grid when truly 2D | Nested content grids for scroll/fill in Studio panes |
| `min-w-0` when menus must paint outside | Spray `overflow-hidden` up the tree and clip popovers |

## Alternatives

| Option | Why not |
| --- | --- |
| One hard ban set for Studio + ideal-stack | Over-constrains marketing / Live pages; fights Chrome guidance |
| Keep `min-w-0` as Studio default | Agents over-apply; Studio prefers one recipe (overflow) |
| Ban all grid outside page shell | Forbids valid 2D cards/forms/atlas |
| Ban all `contain` / `container-type` | Breaks Studio pane container queries |

## Related

- `.cursor/rules/design/natural-document-flow.mdc` — full laws + audience split + cheat sheet
- `.cursor/rules/design/layout.mdc` — Studio G6/S2 detail
- `.cursor/rules/shell/studio-windows.mdc` — DeskPane overflow bands + scroll leaf
- `.cursor/rules/architecture/semantic-html-css.mdc`
- `.cursor/rules/design/layout.mdc`
- [Flexbox §4.5](https://www.w3.org/TR/css-flexbox-1/#min-size-auto) · [Chrome CSS layout guide](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/css-layout/css-layout.md)
