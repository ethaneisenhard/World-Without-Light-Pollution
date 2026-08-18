# @glassbox-studio/analytics

Canonical analytics call site for any Glass Box Studio / ideal-stack project.

```ts
import { createAnalytics } from "@glassbox-studio/analytics";

const analytics = createAnalytics({ context, transport });
analytics.track("cta_clicked", { label: "Get started" });
analytics.page();
analytics.identify(userId, { email });
```

### Destinations

```ts
import { createAnalytics, createDestinationsTransport } from "@glassbox-studio/analytics";

const transport = createDestinationsTransport({
  environment: "dev",
  destinations: [
    { provider: "first-party", events: "*" },
    { provider: "webhook", config: { url: "https://hooks.example/ingest" } },
    { provider: "ga4", enabledIn: ["production"], config: { measurementId: "G-…", apiSecret: "…" } },
  ],
  consentAllows: (cat) => cat !== "analytics" || hasAnalyticsConsent,
});

const analytics = createAnalytics({ context, transport });
```

Inspired by BrowserUI `@browserui/analytics` (+ destination adapters Glass Box Studio ships in-library).

Identity cookies/fields: `@glassbox-studio/identity`.
