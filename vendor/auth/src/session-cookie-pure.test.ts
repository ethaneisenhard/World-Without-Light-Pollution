import { describe, expect, it } from "vitest";
import {
  parseCookie,
  signSessionUserId,
  verifySessionUserId,
} from "./session-cookie-pure.js";

describe("session-cookie-pure", () => {
  it("round-trips signed user id", async () => {
    const token = await signSessionUserId("user-1", "secret-key");
    expect(await verifySessionUserId(token, "secret-key")).toBe("user-1");
    expect(await verifySessionUserId(token, "wrong")).toBeNull();
  });

  it("parses cookie header", () => {
    expect(parseCookie("a=1; as_auth=tok%2Evalue; b=2", "as_auth")).toBe("tok.value");
  });
});
