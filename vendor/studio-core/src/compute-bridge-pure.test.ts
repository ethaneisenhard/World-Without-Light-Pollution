import { describe, expect, it } from "vitest";
import { defaultVaultAppsConfig } from "./vault-app-storage-pure.js";
import {
  classifyHostApiRoute,
  isOfflineVaultAttach,
  offlineVaultBannerCopy,
  resolveComputeDelegateTarget,
  resolveVaultAwareHostProxy,
  vaultAppIdForApiPath,
  vaultRouteMustStayOnVaultHost,
  vaultStickySettingsCopy,
} from "./compute-bridge-pure.js";

describe("compute-bridge-pure", () => {
  it("classifies vault routes", () => {
    expect(classifyHostApiRoute("/api/notes/tree")).toBe("vault");
    expect(classifyHostApiRoute("/api/ledger/chats")).toBe("vault");
    expect(classifyHostApiRoute("/api/media/list")).toBe("vault");
    expect(classifyHostApiRoute("https://api.desk/api/calendar/events")).toBe(
      "vault",
    );
    expect(vaultRouteMustStayOnVaultHost("/api/notes/read")).toBe(true);
  });

  it("classifies compute routes", () => {
    expect(classifyHostApiRoute("/api/files/list")).toBe("compute");
    expect(classifyHostApiRoute("/api/runtimes")).toBe("compute");
    expect(classifyHostApiRoute("/api/git/status")).toBe("compute");
  });

  it("never delegates vault; local compute needs bridge", () => {
    expect(
      resolveComputeDelegateTarget({
        routeClass: "vault",
        placement: "local",
        bridgeUrl: "http://127.0.0.1:3847",
      }).kind,
    ).toBe("vault-host");

    expect(
      resolveComputeDelegateTarget({
        routeClass: "compute",
        placement: "hosted",
      }).kind,
    ).toBe("vault-host");

    expect(
      resolveComputeDelegateTarget({
        routeClass: "compute",
        placement: "local",
        bridgeUrl: null,
      }).kind,
    ).toBe("unreachable");

    const bridged = resolveComputeDelegateTarget({
      routeClass: "compute",
      placement: "local",
      bridgeUrl: "http://127.0.0.1:3847/",
    });
    expect(bridged).toEqual({
      kind: "bridge",
      bridgeUrl: "http://127.0.0.1:3847",
      reason: "placement_local",
    });
  });

  it("offline vault banner for laptop attach", () => {
    expect(isOfflineVaultAttach("laptop")).toBe(true);
    expect(isOfflineVaultAttach("desk")).toBe(false);
    expect(offlineVaultBannerCopy().title).toMatch(/Offline vault/i);
    expect(offlineVaultBannerCopy().body).toMatch(/Messages/);
    expect(vaultStickySettingsCopy().body).toMatch(/offline escape/i);
  });

  it("pins Cloud-On messages to Cloud Host while Local Host is attached", () => {
    const desk = "https://api.auth.glassboxcomputer.site";
    const laptop = "http://127.0.0.1:3847";
    expect(
      resolveVaultAwareHostProxy({
        path: "/api/messages?limit=50",
        attachProxy: laptop,
        vaultHostProxy: desk,
      }),
    ).toBe(desk);
    expect(
      resolveVaultAwareHostProxy({
        path: "/api/messages/abc/html",
        attachProxy: laptop,
        vaultHostProxy: desk,
        vaultApps: { ...defaultVaultAppsConfig(), messages: false },
      }),
    ).toBe(laptop);
    expect(
      resolveVaultAwareHostProxy({
        path: "/api/files/list",
        attachProxy: laptop,
        vaultHostProxy: desk,
      }),
    ).toBe(laptop);
    expect(vaultAppIdForApiPath("/api/ledger/chats")).toBe("chats");
  });
});
