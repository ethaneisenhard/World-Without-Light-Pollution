/** HttpOnly first-party visitor cookie. */
export const VISITOR_COOKIE_NAME = "as_visitor_id";

/** Session cookie — rotates after idle timeout. */
export const SESSION_COOKIE_NAME = "as_session_id";

export const VISITOR_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 395; // ~13 months

export const SESSION_IDLE_MS = 30 * 60 * 1000;

/** Hidden fields analytics stamps on form POSTs (cookie fallback). */
export const FORM_VISITOR_FIELD = "__as_visitor_id";
export const FORM_SESSION_FIELD = "__as_session_id";
export const FORM_PAGE_ROUTE_FIELD = "__as_page_route";
