import { describe, expect, it } from "vitest";
import {
  chatShipReceiptPending,
  chatShipReceiptShouldVerify,
  chatTurnLooksLikeShipRebuild,
  extractChatTurnToolNames,
  classifyDeployProbe,
  classifyDeployVerifyMcp,
  formatChatShipReceipt,
  receiptFromDeployVerifyMcp,
  looksLikeIncompleteShipNarration,
  resolveDeployVerifyUrl,
  userAskedToShip,
} from "./deploy-verify-pure.js";

describe("deploy-verify-pure", () => {
  it("LAW: ship it / deploy from chat is a ship ask", () => {
    expect(userAskedToShip("ship it")).toBe(true);
    expect(userAskedToShip("Ship this to cloud")).toBe(true);
    expect(userAskedToShip("deploy now")).toBe(true);
    expect(userAskedToShip("what is shipping cost")).toBe(false);
  });

  it("LAW: forcing deploy / rebuilding tail is incomplete narration", () => {
    expect(
      looksLikeIncompleteShipNarration(
        "Source has the new classes, but the bundle still has the old ones. Rebuilding client JS without the locked styles step, then forcing deploy.",
      ),
    ).toBe(true);
    expect(
      looksLikeIncompleteShipNarration(
        "It's live on Cloud.\n\nhttps://auth.example",
      ),
    ).toBe(false);
    expect(
      looksLikeIncompleteShipNarration(
        "Shipped to Cloud.\n\nhttps://auth.example",
      ),
    ).toBe(false);
  });

  it("verify after ship ask or deploy tool", () => {
    expect(
      chatShipReceiptShouldVerify({
        userContent: "ship it",
        assistantContent: "forcing deploy.",
      }),
    ).toBe(true);
    expect(
      chatShipReceiptShouldVerify({
        userContent: "hi",
        assistantContent: "hello",
        tools: [{ name: "deploy.ship" }],
      }),
    ).toBe(true);
    expect(
      chatShipReceiptShouldVerify({
        userContent: "ship it",
        assistantContent: "Which workspace should I ship?",
      }),
    ).toBe(false);
    expect(
      chatShipReceiptShouldVerify({
        userContent: "hi",
        assistantContent: "hello",
      }),
    ).toBe(false);
    expect(
      chatShipReceiptShouldVerify({
        userContent: "fix the chrome",
        assistantContent: "Rebuilding client JS, then forcing deploy.",
        hostTools: ["shell.run"],
      }),
    ).toBe(false);
    expect(
      chatShipReceiptShouldVerify({
        userContent: "fix the chrome",
        assistantContent: "Rebuilding client JS, then forcing deploy.",
        hostShipRebuild: true,
      }),
    ).toBe(true);
    expect(
      chatShipReceiptShouldVerify({
        userContent: "fix the chrome",
        assistantContent: "Rebuilding client JS, then forcing deploy.",
        hostTools: ["deploy.ship"],
      }),
    ).toBe(true);
  });

  it("LAW: Host turn events mark rebuild / wrangler as a ship", () => {
    expect(
      extractChatTurnToolNames([
        { event: "delta", data: { text: "hi" } },
        {
          event: "tool-start",
          data: {
            name: "shell.run",
            input: { command: "pnpm build:client" },
          },
        },
      ]),
    ).toEqual(["shell.run"]);
    expect(
      chatTurnLooksLikeShipRebuild({
        events: [
          {
            event: "tool-start",
            data: {
              name: "shell.run",
              input: { command: "npx wrangler deploy" },
            },
          },
        ],
      }),
    ).toBe(true);
    expect(
      chatTurnLooksLikeShipRebuild({
        events: [{ event: "tool-start", data: { name: "files.read" } }],
      }),
    ).toBe(false);
  });

  it("probe 2xx is live; else failed", () => {
    expect(classifyDeployProbe({ status: 200, url: "https://a.test" })).toBe(
      "live",
    );
    expect(classifyDeployProbe({ status: 503, url: "https://a.test" })).toBe(
      "failed",
    );
  });

  it("receipt copy — Cloud, no Host, complete sentences", () => {
    const pending = chatShipReceiptPending();
    expect(pending.face).toBe("pending");
    expect(pending.title).toMatch(/Cloud/i);
    expect(pending.title).not.toMatch(/Host/i);

    const live = formatChatShipReceipt({
      kind: "live",
      url: "https://auth.example",
    });
    expect(live.face).toBe("live");
    expect(live.body).toContain("Shipped to Cloud");
    expect(live.body).toContain("https://auth.example");
    expect(live.body).not.toMatch(/Host/i);

    const failed = formatChatShipReceipt({ kind: "failed", url: "" });
    expect(failed.face).toBe("failed");
    expect(failed.body).toMatch(/Ask chat to ship again/);
  });

  it("MCP verify result → receipt", () => {
    expect(classifyDeployVerifyMcp({ ok: true, verified: true })).toBe("live");
    expect(classifyDeployVerifyMcp({ ok: true, verified: false })).toBe(
      "failed",
    );
    const live = receiptFromDeployVerifyMcp({
      ok: true,
      verified: true,
      url: "https://auth.example",
    });
    expect(live.face).toBe("live");
    expect(live.url).toBe("https://auth.example");
  });

  it("verify URL prefers override then prod", () => {
    expect(
      resolveDeployVerifyUrl({
        override: " https://b.test ",
        prodUrl: "https://a.test",
      }),
    ).toBe("https://b.test");
    expect(resolveDeployVerifyUrl({ prodUrl: "https://a.test" })).toBe(
      "https://a.test",
    );
    expect(resolveDeployVerifyUrl({})).toBeNull();
  });
});
