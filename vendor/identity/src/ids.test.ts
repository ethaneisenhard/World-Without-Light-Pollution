import { describe, expect, it } from "vitest";
import {
  FORM_PAGE_ROUTE_FIELD,
  FORM_SESSION_FIELD,
  FORM_VISITOR_FIELD,
  SESSION_COOKIE_NAME,
  VISITOR_COOKIE_NAME,
  mintId,
  mintSessionId,
  mintVisitorId,
} from "./index.js";

describe("@glassbox-studio/identity", () => {
  it("exports as_ cookie and form field names", () => {
    expect(VISITOR_COOKIE_NAME).toBe("as_visitor_id");
    expect(SESSION_COOKIE_NAME).toBe("as_session_id");
    expect(FORM_VISITOR_FIELD).toBe("__as_visitor_id");
    expect(FORM_SESSION_FIELD).toBe("__as_session_id");
    expect(FORM_PAGE_ROUTE_FIELD).toBe("__as_page_route");
  });

  it("mints unique ids", () => {
    const a = mintId();
    const b = mintId();
    expect(a).not.toBe(b);
    expect(mintVisitorId().length).toBeGreaterThan(8);
    expect(mintSessionId().length).toBeGreaterThan(8);
  });
});
