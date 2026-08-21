# Studio Starter (ideal-stack)

Remix 3 + Cloudflare Worker template. Same architecture / design / remix contracts as Glass Box Studio shell — not a second stack.

## Agent rules (always on here)

See [`.cursor/rules/RULES-INDEX.md`](.cursor/rules/RULES-INDEX.md). Synced from the monorepo via `pnpm rules:sync-ideal-stack`.

| Folder | Contract |
| --- | --- |
| `architecture/` | Pure + orchestrators; DRY; module size; folder hygiene; no one-offs; semantic HTML/CSS laws |
| `remix/` | Kody Remix 3 + Handle / URL / loaders; pending + optimistic; XState for **all** client UI |
| `design/` | `@theme` tokens; slots; Inspect `data-as-*`; section → container → content; Heroicons; **natural document flow** (no `min-w-0`/`min-h-0`, rare `h-full` — ADR 0007) |

**Not in this template:** Studio chrome rules (`shell/`) — DeskPane / compact shell stay in `apps/studio`.

## Stack shape

```
src/              # Worker entry, pure modules, compose
client/           # remix/ui design sandbox / Inspect
content/pages/    # markdown pages
.glassbox-studio/    # project.json + design.json
.cursor/rules/    # architecture + design + remix (synced)
```

Follow [kentcdodds/kody](https://github.com/kentcdodds/kody): Worker + `remix/ui` Handle — not Vite SPA, not ad-hoc `useState` clusters.

## Content

Pages live in `content/pages/`. Visitor copy is the experience — never narrate layout, cards, or how to use the page. Rule: `.cursor/rules/project/visitor-copy.mdc`.
