/**
 * Browser entry for consent + analytics bootstrap.
 * Built to public/analytics-client.js and loaded from site HTML.
 */
import { mountPrivacyPrompt, CONSENT_GRANT_EVENT } from "@glassbox-studio/consent";
import { bootAnalyticsConsent } from "../../src/analytics/boot-pure.js";

declare global {
  interface Window {
    agentStudio?: {
      consent?: ReturnType<typeof bootAnalyticsConsent>["consent"];
      analytics?: NonNullable<ReturnType<typeof bootAnalyticsConsent>["analytics"]>;
    };
    __AS_ANALYTICS_BOOT__?: {
      siteId: string;
      analytics: unknown;
      consent: unknown;
      environment?: "dev" | "staging" | "production";
    };
  }
}

function run() {
  const cfg = window.__AS_ANALYTICS_BOOT__;
  if (!cfg) return;

  const boot = bootAnalyticsConsent({
    siteId: cfg.siteId,
    analyticsJson: cfg.analytics,
    consentJson: cfg.consent,
    environment: cfg.environment ?? "dev",
    // Persist Accept/Reject — memory storage made Live iframe reloads re-banner.
    storage: window.localStorage,
  });

  window.agentStudio = {
    consent: boot.consent,
    analytics: boot.analytics ?? undefined,
  };

  const startTracking = () => boot.maybePage();

  if (boot.shouldShowBanner) {
    mountPrivacyPrompt({
      consent: boot.consent,
      banner: boot.banner,
      categories: boot.categories,
      preferences: boot.preferences,
      onConsentDecision: startTracking,
    });
  } else {
    startTracking();
  }

  document.addEventListener(CONSENT_GRANT_EVENT, () => startTracking());
}

run();
