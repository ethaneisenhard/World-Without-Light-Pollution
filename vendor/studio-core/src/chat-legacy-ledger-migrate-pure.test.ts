import { describe, expect, it } from "vitest";
import {
  migrateLegacyProjectSessionsIntoGlobal,
  type ChatSession,
  type ChatSessionState,
} from "./chat-legacy-ledger-migrate-pure.js";

function sess(
  partial: Partial<ChatSession> & Pick<ChatSession, "id" | "messages">,
): ChatSession {
  return {
    title: "Chat",
    mode: "agent",
    createdAt: 1,
    updatedAt: 1,
    tabOpen: false,
    ...partial,
  };
}

describe("migrateLegacyProjectSessionsIntoGlobal", () => {
  it("stamps contextProjectId and merges project bags into global", () => {
    const global: ChatSessionState = {
      activeId: "g1",
      sessions: [
        sess({
          id: "g1",
          title: "Keep me",
          messages: [{ role: "user", content: "unrelated" }],
          updatedAt: 10,
        }),
      ],
    };
    const projectBags = {
      "beehiiv-com": {
        activeId: "b1",
        sessions: [
          sess({
            id: "b1",
            title: "Beehiiv thread",
            messages: [
              { role: "user", content: "hello beehiiv" },
              { role: "assistant", content: "hi" },
            ],
            updatedAt: 20,
          }),
        ],
      },
    };

    const out = migrateLegacyProjectSessionsIntoGlobal({
      global,
      projectBags,
    });

    expect(out.importedCount).toBe(1);
    expect(out.emptiedProjectIds).toEqual(["beehiiv-com"]);
    const imported = out.global.sessions.find((s) => s.id === "b1");
    expect(imported?.contextProjectId).toBe("beehiiv-com");
    expect(out.global.sessions.map((s) => s.id).sort()).toEqual(["b1", "g1"]);
  });

  it("dedupes same opener — prefers workspace-tagged richer copy", () => {
    const opener = "same opener text";
    const global: ChatSessionState = {
      activeId: "studio-copy",
      sessions: [
        sess({
          id: "studio-copy",
          title: opener,
          messages: [
            { role: "user", content: opener },
            { role: "assistant", content: "short" },
          ],
          updatedAt: 5,
        }),
      ],
    };
    const projectBags = {
      "beehiiv-com": {
        activeId: "ws-copy",
        sessions: [
          sess({
            id: "ws-copy",
            title: opener,
            messages: [
              { role: "user", content: opener },
              { role: "assistant", content: "longer" },
              { role: "user", content: "follow" },
            ],
            updatedAt: 9,
          }),
        ],
      },
    };

    const out = migrateLegacyProjectSessionsIntoGlobal({
      global,
      projectBags,
    });

    expect(out.global.sessions).toHaveLength(1);
    expect(out.global.sessions[0]?.id).toBe("ws-copy");
    expect(out.global.sessions[0]?.contextProjectId).toBe("beehiiv-com");
    expect(out.emptiedProjectIds).toEqual(["beehiiv-com"]);
  });

  it("skips empty New chat stubs and ignores global bag key", () => {
    const global: ChatSessionState = { activeId: null, sessions: [] };
    const out = migrateLegacyProjectSessionsIntoGlobal({
      global,
      projectBags: {
        "": {
          activeId: "x",
          sessions: [
            sess({
              id: "x",
              messages: [{ role: "user", content: "should ignore" }],
            }),
          ],
        },
        "demo-blog": {
          activeId: "empty",
          sessions: [
            sess({
              id: "empty",
              title: "New chat",
              messages: [],
              updatedAt: 1,
            }),
          ],
        },
      },
    });
    expect(out.importedCount).toBe(0);
    expect(out.emptiedProjectIds).toEqual([]);
    expect(out.global.sessions).toEqual([]);
  });
});
