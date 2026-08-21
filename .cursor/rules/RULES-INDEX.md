# Ideal-stack starter rules

Synced from monorepo `.cursor/rules/{architecture,design,remix}`.

**Do not edit these `.mdc` files by hand.** Change the repo-root copies, then run:

```bash
pnpm rules:sync-ideal-stack
```

| Folder | Contract |
| --- | --- |
| `architecture/` | Pure modules, DRY, size, folder hygiene, no one-offs, markup/layout laws |
| `remix/` | Kody / Remix 3 + Handle / optimistic UI / XState |
| `design/` | Inspect stamps, hierarchy, tokens, slots, `@theme`, CSS document-flow (ADR 0007) |

Always-on layout law: `design/natural-document-flow.mdc` — follow **§ General practice (G1–G10)** only. Skip **§ Studio chrome policy (S1–S5)** unless building Studio-like app chrome. ADR copy: `docs/adr/0007-natural-document-flow.md` (shipped with starter; not overwritten by this sync).

**Not shipped** (Studio chrome only): `shell/`, `agent/`.

**This project (not synced):** `project/visitor-copy.mdc` — visitor pages never explain how the site works.

See template `AGENTS.md` and monorepo `.cursor/rules/RULES-INDEX.md`.
