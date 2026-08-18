export { createAnalytics, type AnalyticsClient, type CreateAnalyticsOptions } from "./client.js";
export {
  resolveAnalyticsEnvironment,
  resolveWorkspaceId,
  type ResolveEnvironmentInput,
} from "./environment.js";
export { collectPageviewProperties } from "./pageview.js";
export {
  createDestinationsTransport,
  type CreateDestinationsTransportOptions,
} from "./destinations-transport.js";
export type {
  AnalyticsDestination,
  AnalyticsDestinationProvider,
  ConsentCategory,
} from "./destination-types.js";
export type {
  AnalyticsContext,
  AnalyticsEnvironment,
  AnalyticsTransport,
  CanonicalEventPayload,
  IdentifyTraits,
} from "./types.js";
export { ANALYTICS_ENVIRONMENTS } from "./types.js";
export {
  parseAnalyticsIntegration,
  parseConsentIntegration,
  type AnalyticsIntegrationDoc,
  type ConsentIntegrationDoc,
  type ParseResult,
} from "./schemas.js";
export {
  PLATFORM_TRACKING_PLAN,
  buildTrackingPlanRows,
  formatTrackingPlanMarkdown,
  isDeprecatedEventName,
  type DeclaredAnalyticsEvent,
  type PlatformEventSpec,
  type TrackingPlanRow,
} from "./tracking-plan.js";
export {
  resolveFormAnalyticsIdentity,
  FORM_PAGE_ROUTE_FIELD,
  FORM_SESSION_FIELD,
  FORM_VISITOR_FIELD,
  type FormAnalyticsIdentity,
} from "./form-identity.js";
export {
  buildFormSubmittedEventProperties,
  postFormSubmittedEvent,
  type FormSubmittedEventInput,
} from "./form-submitted.js";
export {
  buildConsentTransparencyRows,
  type ConsentTransparencyRow,
  type ScriptDeclaration,
} from "./consent-transparency.js";
