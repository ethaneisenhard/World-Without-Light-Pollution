import { describe, expect, it } from "vitest";
import {
  classifyHostAttachProxy,
  classifyHostSelfIdentity,
  classifyShellPageHostAttach,
  DEFAULT_DESK_HOST_PROXY,
  DEFAULT_LAPTOP_HOST_PROXY,
  dualShellHostModelOk,
  ensureHostIdentityInChatContext,
  formatHostIdentityChatLines,
  hostSpokenAnswer,
  listShellAttachTargets,
  normalizeHostProxyUrl,
  parseShellAttachBody,
  resolveDeskAttachProxyHint,
  shellAttachHotSwitchAllowed,
  shellAttachTargetIdForProxy,
} from "./host-attach-pure.js";

describe("host-attach-pure", () => {
  it("classifies desk Host", () => {
    const p = classifyHostAttachProxy("https://api.auth.glassboxcomputer.site/");
    expect(p.role).toBe("desk");
    expect(p.proxy).toBe("https://api.auth.glassboxcomputer.site");
    expect(p.label).toBe("Cloud");
    expect(
      classifyHostAttachProxy("https://api.desk.browserui.site/").role,
    ).toBe("desk");
    expect(
      classifyHostAttachProxy("https://api.acme.glassboxcomputer.site").role,
    ).toBe("desk");
    expect(
      classifyHostAttachProxy("https://studio.glassboxcomputer.com/").role,
    ).toBe("desk");
  });

  it("classifies laptop / tailnet", () => {
    expect(classifyHostAttachProxy("http://127.0.0.1:3847").role).toBe(
      "laptop",
    );
    expect(
      classifyHostAttachProxy("https://studio.tail0a3a18.ts.net:3847").role,
    ).toBe("laptop");
  });

  it("classifies custom + empty", () => {
    expect(classifyHostAttachProxy("https://bu-acme-host.fly.dev").role).toBe(
      "custom",
    );
    expect(classifyHostAttachProxy("").role).toBe("none");
    expect(normalizeHostProxyUrl("https://x.com/api/")).toBe("https://x.com");
  });

  it("documents dual-shell model", () => {
    expect(dualShellHostModelOk()).toBe(true);
  });

  it("lists desk + laptop hot-switch targets", () => {
    const targets = listShellAttachTargets();
    expect(targets.map((t) => t.id)).toEqual(["desk", "laptop"]);
    expect(shellAttachTargetIdForProxy(targets[0]!.proxy)).toBe("desk");
    expect(parseShellAttachBody({ targetId: "laptop" }).ok).toBe(true);
  });

  it("keeps Cloud distinct when boot proxy is Local", () => {
    expect(resolveDeskAttachProxyHint("http://127.0.0.1:3847")).toBe(
      DEFAULT_DESK_HOST_PROXY,
    );
    const targets = listShellAttachTargets({
      deskProxy: "http://127.0.0.1:3847",
    });
    expect(targets[0]!.proxy).toBe(DEFAULT_DESK_HOST_PROXY);
    expect(targets[1]!.proxy).toBe(DEFAULT_LAPTOP_HOST_PROXY);
    expect(targets[0]!.proxy).not.toBe(targets[1]!.proxy);
    expect(shellAttachTargetIdForProxy("http://127.0.0.1:3847", targets)).toBe(
      "laptop",
    );
    expect(
      shellAttachHotSwitchAllowed({ shellHostname: "127.0.0.1:4400" }),
    ).toBe(true);
    expect(
      shellAttachHotSwitchAllowed({ shellHostname: "app.browserui.site" }),
    ).toBe(false);
  });

  it("speaks Cloud for desk Host identity", () => {
    const desk = classifyHostAttachProxy(
      "https://api.auth.glassboxcomputer.site",
    );
    expect(hostSpokenAnswer(desk)).toBe("Cloud");
    const lines = formatHostIdentityChatLines(desk);
    expect(lines.join("\n")).toMatch(/Cloud/);
    expect(lines.join("\n")).toMatch(/Do NOT say "local"/i);
    expect(
      classifyShellPageHostAttach({
        shellHostname: "glassbox-studio.devbyethan.workers.dev",
      }).role,
    ).toBe("desk");
    expect(
      classifyShellPageHostAttach({
        shellHostname: "glassboxcomputer.site",
      }).role,
    ).toBe("desk");
    expect(
      classifyHostSelfIdentity({ deskDomain: "desk.browserui.site" }).role,
    ).toBe("desk");
    const ensured = ensureHostIdentityInChatContext("scope: GLOBAL", desk);
    expect(ensured).toMatch(/Studio place: Cloud/);
    expect(ensureHostIdentityInChatContext(ensured, desk)).toBe(ensured);
  });
});
