# World Without Light Pollution

Educational + advocacy site about light pollution — forked from the Glass Box
Studio **studio starter** (`projects/glassbox-studio-template`) into a
self-contained folder workspace.

**Stack:** Cloudflare Worker + plain-HTML SSR + Tailwind v4 tokens, shared
`@glassbox-studio/*` packages vendored under `vendor/`.

## Stack

| Concern | Tech |
| --- | --- |
| Runtime | Cloudflare Worker (wrangler) — `src/index.ts` → `src/render-html.ts` |
| Content | Markdown in `content/pages/*.md` → `src/pages.generated.ts` (`node scripts/generate-pages.mjs`) |
| UI | Plain-HTML SSR + `@glassbox-studio/components` primitives + Tailwind tokens (`src/styles/site.css`) |
| Theme | Design tokens in `design/design-system.json` → `src/styles/theme.generated.css` (`pnpm generate:theme`) |
| Auth | `@glassbox-studio/auth` (D1) — wired but dormant for the educational v1 |

## Run

```bash
pnpm install
pnpm dev                    # http://127.0.0.1:8794
```

## Pages

`/` (home) · `/what-is-light-pollution` · `/lumens` · `/impacts` · `/petition`
· `/resources` · `/email-your-county` · `/about` · `/contact`

## Editing content

Edit `content/pages/<slug>.md`, then `node scripts/generate-pages.mjs` (the
`pnpm dev` script regenerates on every start).

## Deploy (Cloudflare)

```bash
wrangler d1 create world-without-light-pollution   # paste database_id into wrangler.jsonc
pnpm db:migrate:local                              # local; remote: add --remote
wrangler deploy
```

## Env vars

| Var | Purpose |
| --- | --- |
| `SESSION_SECRET` | session cookie signing |
| `APP_ORIGIN` | Google redirect_uri + reset links |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (optional; email/password works without) |
