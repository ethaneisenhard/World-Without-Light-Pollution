import { describe, expect, it } from "vitest";
import {
  resolveWorkspaceImportDiskFace,
  workspaceImportDiskCopy,
  workspaceImportFinderErrorCopy,
  workspaceImportPlaceFromAttachId,
} from "./workspace-import-disk-access-pure.js";

describe("workspace-import-disk-access-pure", () => {
  it("Cloud and Local both open Finder on the attached disk", () => {
    expect(
      resolveWorkspaceImportDiskFace({ attachId: "laptop", switchAllowed: true }),
    ).toBe("finder");
    expect(
      resolveWorkspaceImportDiskFace({ attachId: "desk", switchAllowed: true }),
    ).toBe("finder");
    expect(
      resolveWorkspaceImportDiskFace({ attachId: "desk", switchAllowed: false }),
    ).toBe("finder");
  });

  it("maps attach id to Cloud vs Local place", () => {
    expect(workspaceImportPlaceFromAttachId("laptop")).toBe("local");
    expect(workspaceImportPlaceFromAttachId("desk")).toBe("cloud");
    expect(workspaceImportPlaceFromAttachId(null)).toBe("cloud");
  });

  it("names Cloud vs Local / this computer — never Host", () => {
    const local = workspaceImportDiskCopy("finder", "local");
    expect(local.title).toMatch(/this computer/i);
    expect(local.sidebarLabel).toBe("Computer");
    expect(local.hint + local.blockedBody).not.toMatch(/\bHost\b/);
    expect(local.hint).not.toMatch(/right-click|double-click/i);

    const cloud = workspaceImportDiskCopy("finder", "cloud");
    expect(cloud.title).toMatch(/cloud/i);
    expect(cloud.hint).toMatch(/cloud/i);
    expect(cloud.hint).not.toMatch(/this computer/i);
    expect(cloud.hint).not.toMatch(/right-click|double-click/i);
    expect(cloud.sidebarLabel).toBe("Cloud");
    expect(`${cloud.title}${cloud.hint}${cloud.sidebarLabel}`).not.toMatch(
      /\bHost\b/,
    );

    const switchFace = workspaceImportDiskCopy("switch-to-local");
    expect(switchFace.hint).toMatch(/Cloud/);
    expect(switchFace.blockedBody).toMatch(/Local/);
    expect(switchFace.switchCta).toBe("Switch to Local");
    expect(`${switchFace.hint}${switchFace.blockedBody}${switchFace.switchCta}`).not.toMatch(
      /\bHost\b/,
    );

    const cloudShell = workspaceImportDiskCopy("need-local-studio");
    expect(cloudShell.hint).toMatch(/Cloud/);
    expect(cloudShell.blockedBody).toMatch(/this computer/);
    expect(cloudShell.blockedBody).toMatch(/Local/);
    expect(cloudShell.switchCta).toBeNull();
    expect(`${cloudShell.hint}${cloudShell.blockedBody}`).not.toMatch(/\bHost\b/);
  });

  it("Cloud list 404 is a load miss — not an empty disk", () => {
    expect(workspaceImportFinderErrorCopy({ error: null, place: "cloud" })).toBeNull();
    const miss = workspaceImportFinderErrorCopy({
      error: "candidates 404",
      place: "cloud",
    });
    expect(miss?.message).toMatch(/Couldn't load folders from Cloud/);
    expect(miss?.emptyLabel).toMatch(/Switch to Local/);
    expect(miss?.emptyLabel).not.toMatch(/No folders here/i);
    expect(miss?.switchCta).toBe("Switch to Local");
    expect(`${miss?.message}${miss?.emptyLabel}`).not.toMatch(/\bHost\b/);

    const local = workspaceImportFinderErrorCopy({
      error: "candidates 404",
      place: "local",
    });
    expect(local?.message).toMatch(/this computer/i);
    expect(local?.switchCta).toBeNull();
  });
});
