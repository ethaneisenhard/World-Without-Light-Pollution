# `@glassbox-studio/auth`

Kent / Kody / epicflare-shaped auth for **Studio shell** and **Studio Starter**.

North star: [docs/architecture/auth.md](../../../docs/architecture/auth.md) · [docs/research/kent-auth-patterns.md](../../../docs/research/kent-auth-patterns.md)

## Surfaces

| Export | Job |
| --- | --- |
| `createBrowserAuth` | Remix session + Google + credentials (Studio) |
| `createPasskeyRouteActions` / `passkeyRoutes` | `@simplewebauthn` register + login |
| `PasskeyStore` / `createD1PasskeyStore` | Kent `Passkey` table |
| `canViewContent` | `public \| members \| subscribers` |
| `handleStarterAuthFetch` | Minimal Worker login without full remix router |
| `createStudioMcpOAuthOptions` | epicflare `@cloudflare/workers-oauth-provider` options for `/mcp` |
| `MCP_OAUTH_ENDPOINTS` / `MCP_WORKER_FETCH_ORDER` | Documented Worker entry order |

## Proof surfaces (Tailwind)

| App | Skin | URL | Creds |
| --- | --- | --- | --- |
| **Studio shell** | `studio` — surface / brand | http://127.0.0.1:4400/login → `/account` | `DEV_SEED_*` after `db:seed:local` |
| **Starter** | `starter` — paper / ink / accent | http://127.0.0.1:8789/login → `/account` + `/members` | `member` / `starter-dev` |

Class sources: `auth-pages-classes.ts` (scanned by Studio + Starter Tailwind builds).

## Starter quick path

1. Depend on `@glassbox-studio/auth`
2. Call `handleStarterAuthFetch` + `requireStarterVisibility` from Worker `fetch`
3. Seed a member (see `glassbox-studio-template` — `member` / `starter-dev`)
4. Detail: [`projects/glassbox-studio-template/AUTH.md`](../../../projects/glassbox-studio-template/AUTH.md)

## MCP OAuth (when ready)

```ts
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { createStudioMcpOAuthOptions } from "@glassbox-studio/auth";

export default new OAuthProvider(
  createStudioMcpOAuthOptions({
    apiHandler: { fetch: handleMcp },
    defaultHandler: { fetch: handleApp },
  }),
);
```

Bind `OAUTH_KV` in wrangler. Order: **OAuth → MCP → assets → app**.

## Migrations

D1 SQL: `./migrations` (Studio wrangler `migrations_dir` → this folder).

## Tests

```bash
pnpm --filter @glassbox-studio/auth test
```
