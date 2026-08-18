import {
  FORM_PAGE_ROUTE_FIELD,
  FORM_SESSION_FIELD,
  FORM_VISITOR_FIELD,
  SESSION_COOKIE_NAME,
  VISITOR_COOKIE_NAME,
  mintSessionId,
  mintVisitorId,
} from "@glassbox-studio/identity";

function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export interface FormAnalyticsIdentity {
  visitorId: string;
  sessionId: string;
  pageRoute: string | null;
}

/** Resolve visitor/session for form_submitted — cookie first, then stamped hidden fields. */
export function resolveFormAnalyticsIdentity(opts: {
  cookieHeader?: string;
  stitch?: {
    visitorId?: string;
    sessionId?: string;
    pageRoute?: string;
  };
}): FormAnalyticsIdentity {
  const visitorId =
    parseCookie(opts.cookieHeader, VISITOR_COOKIE_NAME) ??
    opts.stitch?.visitorId ??
    mintVisitorId();
  const sessionId =
    parseCookie(opts.cookieHeader, SESSION_COOKIE_NAME) ??
    opts.stitch?.sessionId ??
    mintSessionId();
  const pageRoute = opts.stitch?.pageRoute ?? null;
  return { visitorId, sessionId, pageRoute };
}

export { FORM_PAGE_ROUTE_FIELD, FORM_SESSION_FIELD, FORM_VISITOR_FIELD };
