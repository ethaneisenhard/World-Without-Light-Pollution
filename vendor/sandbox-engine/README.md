# Sandbox engine

Library-agnostic component sandbox: registry, inspector draft, permutations, HTML shell, optional remix/ui adapter.

## Shape

| Layer | Package export | Role |
| --- | --- | --- |
| Pure | `@glassbox-studio/sandbox-engine` | `createSandboxRegistry`, drafts, permutation specs |
| HTML | `@glassbox-studio/sandbox-engine/html` | SSR page + inspector chrome + `/render` payload |
| remix | `@glassbox-studio/sandbox-engine/remix` | `defineRemixAdapter`, `RemixSandboxShell` |
| Client | `src/client/inspector.js` | Live inspector (copy into project `public/` for Worker ASSETS) |

## Register a component

```ts
import { createSandboxRegistry } from "@glassbox-studio/sandbox-engine";

export const registry = createSandboxRegistry([
  {
    meta, // DesignComponentMeta from studio-core
    defaultChildren: "…",
    slotTextDefaults: { title: "…" },
    slotsFromText: (text) => ({ /* … */ }),
    renderHtml: (ctx) => `…`, // SSR / inspector refresh
    adapters: {
      remix: defineRemixAdapter({
        Component: MyHandle,
        mapDraftToProps: (draft) => ({ … }),
      }),
    },
  },
]);
```

Projects own component implementations. Engine owns Sandbox chrome + draft sync rules.

## Studio

Studio **Design** window iframes the project design URL. Engine runs inside the project Worker (HTML path) or client remix shell.
