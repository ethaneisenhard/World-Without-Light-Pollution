import { describe, expect, it } from "vitest";
import {
  HOST_BACKUP_FORMAT_VERSION,
  HOST_BACKUP_KIND,
  buildHostBackupManifest,
  buildHostBackupPlan,
  buildHostRestorePlan,
  hostBackupDbLogicalPath,
  parseHostBackupManifest,
} from "./host-backup-pure.js";

const join = (...parts: string[]) => parts.join("/").replace(/\/+/g, "/");

describe("host-backup-pure", () => {
  it("builds plan with home entries + db roles", () => {
    const plan = buildHostBackupPlan({
      studioHome: "/data/glassbox-studio",
      dbSources: {
        ledger: "/data/glassbox-studio/studio.db",
        messages: "/var/msg.db",
      },
      joinPath: join,
    });
    expect(plan.some((e) => e.logicalPath === "registry.json")).toBe(true);
    expect(plan.some((e) => e.logicalPath === "workspaces")).toBe(true);
    const ledger = plan.find((e) => e.role === "ledger");
    expect(ledger?.logicalPath).toBe(hostBackupDbLogicalPath("ledger"));
    expect(ledger?.sourceAbs).toBe("/data/glassbox-studio/studio.db");
    expect(plan.find((e) => e.role === "messages")?.sourceAbs).toBe(
      "/var/msg.db",
    );
    expect(plan.find((e) => e.role === "notifications")).toBeUndefined();
  });

  it("rejects unsafe logical paths in manifest", () => {
    const bad = parseHostBackupManifest({
      formatVersion: HOST_BACKUP_FORMAT_VERSION,
      kind: HOST_BACKUP_KIND,
      createdAt: "2026-01-01T00:00:00.000Z",
      studioHomeHint: "/x",
      entries: [{ logicalPath: "../etc/passwd", kind: "file" }],
    });
    expect(bad.ok).toBe(false);
  });

  it("round-trips manifest parse", () => {
    const manifest = buildHostBackupManifest({
      studioHome: "/home",
      createdAt: "2026-07-22T00:00:00.000Z",
      present: [
        {
          logicalPath: "registry.json",
          kind: "file",
          sourceAbs: "/home/registry.json",
        },
        {
          logicalPath: hostBackupDbLogicalPath("ledger"),
          kind: "file",
          sourceAbs: "/home/studio.db",
          role: "ledger",
        },
      ],
    });
    const parsed = parseHostBackupManifest(manifest);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.manifest.entries).toHaveLength(2);
  });

  it("maps restore destinations for home + db roles", () => {
    const manifest = buildHostBackupManifest({
      studioHome: "/old",
      createdAt: "t",
      present: [
        {
          logicalPath: "registry.json",
          kind: "file",
          sourceAbs: "/old/registry.json",
        },
        {
          logicalPath: hostBackupDbLogicalPath("ledger"),
          kind: "file",
          sourceAbs: "/old/studio.db",
          role: "ledger",
        },
      ],
    });
    const plan = buildHostRestorePlan({
      manifest,
      backupDir: "/backup",
      targetStudioHome: "/new",
      targetDbPaths: { ledger: "/new/studio.db" },
      joinPath: join,
    });
    expect("error" in plan).toBe(false);
    if ("error" in plan) return;
    expect(plan[0]?.destAbs).toBe("/new/registry.json");
    expect(plan[0]?.bundleAbs).toBe("/backup/data/registry.json");
    expect(plan[1]?.destAbs).toBe("/new/studio.db");
  });
});
