# Starter auth (dormant)

Leftover from the studio-starter fork. The public World Without Light Pollution
site does not show Sign in. Keep this file only if you later turn auth on.

Uses shared `@glassbox-studio/auth` (Kent / Kody-shaped). Login / account / members are **Tailwind** pages on `/styles.css` — same ideal-stack tokens as the marketing site (`bg-paper`, `text-ink`, `border-line`, `bg-accent`, `font-display`).

## Prove it locally

1. Run the template Worker (`pnpm --filter @glassbox-studio/glassbox-studio-template dev` → `:8789`).
2. Open http://127.0.0.1:8789/members — should redirect to `/login`.
3. Sign in: **member** / **starter-dev** (or `member@example.com`).
4. Land on `/account`, then open `/members`.

Nav: **Members** + **Sign in** on every marketing page. Home secondary CTA → Members area.

## Studio shell

Studio (`:4400`) uses the same package with the **studio** skin (`bg-canvas` / `bg-surface` / `bg-brand-600`) via `/styles.css`:

- http://127.0.0.1:4400/login — credentials / Google  
- Seed user from `apps/studio/.env.local` (`DEV_SEED_*`) after `pnpm --filter @glassbox-studio/app db:seed:local`  
- After login → `/account`
