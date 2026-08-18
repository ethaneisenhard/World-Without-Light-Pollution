# @glassbox-studio/consent

Visitor consent API + privacy-prompt machine for ideal-stack projects.

UI matches BrowserUI: fixed overlay, floating white panel, primary/secondary actions, customize toggles (injected self-contained CSS).

```ts
import { createConsentApi, mountPrivacyPrompt, CONSENT_GRANT_EVENT } from "@glassbox-studio/consent";

const consent = createConsentApi({ siteId: "starter", policyVersion: "1" });
mountPrivacyPrompt({
  consent,
  banner: { /* from integrations/consent.json */ },
  categories: { /* … */ },
  preferences: { /* … */ },
});
document.addEventListener(CONSENT_GRANT_EVENT, () => { /* start analytics */ });
```

Grant event: `agentStudio:consent-grant`. Preferences open: `agentStudio:consent-preferences-open` or `[data-as-action="cookie-preferences"]`. Storage key: `as_consent_v1:{siteId}:{policyVersion}`.
