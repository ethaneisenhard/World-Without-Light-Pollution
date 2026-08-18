import { describe, expect, it } from "vitest";
import {
  VAULT_APPS_COOKIE,
  buildVaultAppStorageRows,
  defaultVaultAppsConfig,
  parseVaultAppsConfig,
  parseVaultAppsCookieHeader,
  parseVaultAppsCookieValue,
  vaultAppCloudOn,
  vaultAppStoragePatch,
  vaultAppStorageSectionCopy,
} from "./vault-app-storage-pure.js";

describe("vault-app-storage-pure", () => {
  it("defaults every global app Cloud On", () => {
    const d = defaultVaultAppsConfig();
    expect(d.notes).toBe(true);
    expect(d.media).toBe(true);
    expect(d.calendar).toBe(true);
    expect(d.messages).toBe(true);
    expect(buildVaultAppStorageRows(null).every((r) => r.cloudOn)).toBe(true);
  });

  it("parses toggles + cloud wrapper shape", () => {
    const c = parseVaultAppsConfig({
      notes: false,
      media: { cloud: true },
    });
    expect(c.notes).toBe(false);
    expect(c.media).toBe(true);
    expect(vaultAppCloudOn(c, "notes")).toBe(false);
    expect(vaultAppStoragePatch("notes", true)).toEqual({
      vaultApps: { notes: true },
    });
  });

  it("section copy names Studio apps", () => {
    expect(vaultAppStorageSectionCopy().title).toMatch(/Studio apps/i);
    expect(vaultAppStorageSectionCopy().body).toMatch(/Local/);
  });

  it("cookie defaults Cloud On and honors Off flags", () => {
    expect(parseVaultAppsCookieHeader(null).messages).toBe(true);
    const off = parseVaultAppsCookieValue("messages:0,notes:1");
    expect(off.messages).toBe(false);
    expect(off.notes).toBe(true);
    const header = `other=1; ${VAULT_APPS_COOKIE}=${encodeURIComponent("messages:0")}`;
    expect(parseVaultAppsCookieHeader(header).messages).toBe(false);
  });
});
