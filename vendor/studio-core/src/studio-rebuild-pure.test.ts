import { describe, expect, it } from "vitest";
import {
  STUDIO_CLIENT_REBUILD_ARGS,
  STUDIO_CLIENT_REBUILD_COMMAND,
  STUDIO_CLIENT_REBUILD_REL_DIR,
  studioClientRebuildCwd,
  workspaceRebuildStudioClientLabel,
} from "./studio-rebuild-pure.js";

describe("studio-rebuild-pure", () => {
  it("points at apps/studio pnpm build:client", () => {
    expect(STUDIO_CLIENT_REBUILD_REL_DIR).toBe("apps/studio");
    expect(STUDIO_CLIENT_REBUILD_COMMAND).toBe("pnpm");
    expect([...STUDIO_CLIENT_REBUILD_ARGS]).toEqual(["build:client"]);
    expect(studioClientRebuildCwd("/repo")).toBe("/repo/apps/studio");
    expect(workspaceRebuildStudioClientLabel()).toMatch(/Studio client/);
  });
});
