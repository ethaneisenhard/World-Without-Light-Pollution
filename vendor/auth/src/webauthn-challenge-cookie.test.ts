import { describe, expect, it } from "vitest";
import {
  createRequestCookieChallengeStore,
  createWebAuthnChallengeCookie,
  readWebAuthnChallengePayload,
  webauthnCookieSecureFromRequest,
} from "./webauthn-challenge-cookie.ts";

describe("webauthn challenge cookie", () => {
  it("round-trips challenge via Set-Cookie", async () => {
    const cookie = createWebAuthnChallengeCookie("test-secret-at-least-32-chars!!");
    const req0 = new Request("https://glassbox-studio.example/login");
    const jar = createRequestCookieChallengeStore({
      cookie,
      request: req0,
      secure: true,
    });
    await jar.store.set("webauthn:auth:anonymous", "challenge-abc");
    const res = await jar.applyToResponse(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    const setCookie = res.headers.get("Set-Cookie");
    expect(setCookie).toBeTruthy();

    const req1 = new Request("https://glassbox-studio.example/verify", {
      headers: { Cookie: setCookie!.split(";")[0]! },
    });
    const payload = await readWebAuthnChallengePayload(cookie, req1);
    expect(payload).toEqual({
      key: "webauthn:auth:anonymous",
      challenge: "challenge-abc",
    });

    const jar2 = createRequestCookieChallengeStore({
      cookie,
      request: req1,
      secure: true,
    });
    expect(await jar2.store.get("webauthn:auth:anonymous")).toBe("challenge-abc");
    expect(await jar2.store.get("webauthn:reg:other")).toBeNull();
  });

  it("detects secure from https origin", () => {
    expect(
      webauthnCookieSecureFromRequest(
        new Request("http://127.0.0.1:4400/"),
        "https://glassbox-studio.devbyethan.workers.dev",
      ),
    ).toBe(true);
    expect(
      webauthnCookieSecureFromRequest(new Request("http://127.0.0.1:4400/")),
    ).toBe(false);
  });
});
