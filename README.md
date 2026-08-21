# World Without Light Pollution

Public site for [worldwithoutlightpollution.org](https://worldwithoutlightpollution.org) — **Reclaim the night sky.**

This repository is the source for the live nonprofit site: visitor copy, pages, design tokens, and the Cloudflare Worker that serves them.

## Stack

| Concern | Tech |
| --- | --- |
| Runtime | Cloudflare Worker (`wrangler`) — `src/index.ts` → `src/render-html.ts` |
| Content | Markdown in `content/pages/*.md` |
| UI | HTML SSR + Tailwind v4 tokens (`src/styles/site.css`, DM Sans + Fraunces) |
| Theme | `design/design-system.json` → `src/styles/theme.generated.css` |
| Hosting | Cloudflare Worker routes on `worldwithoutlightpollution.org` (see `wrangler.jsonc`) |

## Pages

| Path | File |
| --- | --- |
| `/` | `content/pages/home.md` |
| `/what-is-light-pollution` | `content/pages/what-is-light-pollution.md` |
| `/lumens` | `content/pages/lumens.md` |
| `/impacts` | `content/pages/impacts.md` |
| `/myths` | `content/pages/myths.md` |
| `/maps` | `content/pages/maps.md` |
| `/petition` | `content/pages/petition.md` |
| `/email-your-county` | `content/pages/email-your-county.md` |
| `/resources` | `content/pages/resources.md` |
| `/about` | `content/pages/about.md` |
| `/contact` | `content/pages/contact.md` |

## Run locally

Requires [Node.js](https://nodejs.org/) 22+ and [pnpm](https://pnpm.io/) 10 (see `.tool-versions`).

```bash
pnpm install
pnpm dev                    # http://127.0.0.1:8794
```

`pnpm dev` rebuilds CSS, regenerates pages from markdown, and starts the local Worker.

```bash
pnpm build                  # generate pages + production CSS
pnpm test                   # vitest
```

Optional: copy `.dev.vars.example` to `.dev.vars` if you need local session/OAuth vars. The public pages do not require them.

## Edit content

1. Edit `content/pages/<slug>.md`.
2. Run `pnpm generate` (or restart `pnpm dev`, which regenerates on start).
3. Keep visitor copy factual and in the site’s voice. Do not invent staff, partners, stats, or quotes.

## Deploy (Cloudflare)

Production already uses a **Cloudflare Worker** (not Pages) with custom routes in `wrangler.jsonc`:

- `worldwithoutlightpollution.org/*`
- `www.worldwithoutlightpollution.org/*`

Domain and DNS stay as they are. This repo is ready to deploy; do not buy a domain or change DNS unless you intend to.

### Manual production deploy

You need the [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI and access to the Cloudflare account that owns the zone.

```bash
pnpm install
pnpm build
npx wrangler deploy
```

`npx wrangler deploy` publishes the Worker and keeps the existing custom-domain routes. D1 (`world-without-light-pollution`) is already bound in `wrangler.jsonc` — do not recreate it.

### Deploy from GitHub

| Event | Workflow | Effect |
| --- | --- | --- |
| Pull request | `.github/workflows/preview.yml` | Uploads a Worker **preview** version. Production is unchanged. |
| Push to `main` | `.github/workflows/deploy.yml` | Runs `wrangler deploy` to production. |

GitHub Actions secrets (same account as the live site):

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Workers deploy / versions upload |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account |

Preview comment URLs look like `https://pr-<n>-world-without-light-pollution.<subdomain>.workers.dev`.

## Project layout

```
content/pages/     visitor markdown (source of truth for copy)
src/               Worker, compose, tests
design/            design tokens
public/            built CSS + static assets
wrangler.jsonc     Worker name, D1, production routes
```

## License

Source code is [MIT](./LICENSE). Visitor copy on the live site remains the voice of World Without Light Pollution.
