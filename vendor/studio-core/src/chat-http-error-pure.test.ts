import { describe, expect, it } from "vitest";
import {
  formatChatHttpError,
  parseChatHttpErrorBody,
  stringifyChatDebugBundle,
  chatAuthFailureLoginHref,
} from "./chat-http-error-pure.js";

describe("chat-http-error-pure", () => {
  it("parses JSON bodies and ignores junk", () => {
    expect(
      parseChatHttpErrorBody(
        JSON.stringify({
          error: "studio_api_unreachable",
          message: "fetch failed",
          hint: "restart",
        }),
      ),
    ).toEqual({
      error: "studio_api_unreachable",
      message: "fetch failed",
      hint: "restart",
    });
    expect(parseChatHttpErrorBody("<html>nope</html>")).toEqual({});
  });

  it("humanizes 503 with retry hint", () => {
    const { message, bundle } = formatChatHttpError({
      status: 503,
      lastStatus: "Connecting…",
      projectId: "www-beehiiv",
      harness: "studio",
      elapsedMs: 10031,
    });
    expect(message).toContain("503");
    expect(message).toContain("hot-reloaded");
    expect(bundle.kind).toBe("studio-chat-debug");
    expect(bundle.projectId).toBe("www-beehiiv");
    expect(bundle.elapsedMs).toBe(10031);
    expect(stringifyChatDebugBundle(bundle)).toContain('"kind": "studio-chat-debug"');
  });

  it("prefers plain-text wrangler restart body", () => {
    const { message, hint } = formatChatHttpError({
      status: 503,
      statusText: "Service Unavailable",
      bodyText:
        "Your worker restarted mid-request. Please try sending the request again.",
    });
    expect(message).toContain("worker restarted mid-request");
    expect(hint).toMatch(/3847|hot-reload/i);
  });

  it("prefers upstream JSON message/hint", () => {
    const { message } = formatChatHttpError({
      status: 502,
      bodyText: JSON.stringify({
        error: "studio_api_unreachable",
        message: "ECONNREFUSED",
        hint: "API on :3847 is down",
      }),
    });
    expect(message).toContain("ECONNREFUSED");
    expect(message).toContain("API on :3847");
  });

  it("401 points at session login, not Anthropic key", () => {
    const { message, hint } = formatChatHttpError({ status: 401 });
    expect(message).toContain("Chat auth failed (401)");
    expect(hint).toMatch(/Sign in again/i);
    expect(hint).not.toMatch(/ANTHROPIC_API_KEY/);
  });

  it("chatAuthFailureLoginHref only for Worker session 401", () => {
    expect(chatAuthFailureLoginHref({ status: 500 })).toBeNull();
    expect(chatAuthFailureLoginHref({ status: 401 })).toBeNull();
    expect(
      chatAuthFailureLoginHref({
        status: 401,
        bodyText: JSON.stringify({ error: "unauthorized" }),
      }),
    ).toBeNull();
    expect(
      chatAuthFailureLoginHref({
        status: 401,
        bodyText: JSON.stringify({
          error: "unauthorized",
          hint: "Sign in to use Studio API",
        }),
      }),
    ).toBe("/login?error=auth&returnTo=%2F");
    expect(
      chatAuthFailureLoginHref({
        status: 403,
        bodyText: JSON.stringify({
          error: "unauthorized",
          hint: "Sign in to use Studio API",
        }),
        returnTo: "/?project=glassbox-studio&chat=1",
      }),
    ).toBe(
      "/login?error=auth&returnTo=%2F%3Fproject%3Dagent-studio%26chat%3D1",
    );
    expect(
      chatAuthFailureLoginHref({
        status: 401,
        bodyText: JSON.stringify({
          error: "unauthorized",
          hint: "Sign in to use Studio API",
        }),
        returnTo: "//evil.example",
      }),
    ).toBe("/login?error=auth&returnTo=%2F");
  });
});
