import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIVE_SYNC_TIMING,
  LIVE_SYNC_DISK_DRAFT_IDLE_MS,
  LIVE_SYNC_DISK_SAVE_DEBOUNCE_MS,
  resolveLiveSyncTiming,
} from "./live-sync-timing-pure.js";

describe("live-sync-timing-pure", () => {
  it("keeps edit-loop disk idle under half a second", () => {
    expect(LIVE_SYNC_DISK_DRAFT_IDLE_MS).toBeLessThanOrEqual(400);
    expect(LIVE_SYNC_DISK_SAVE_DEBOUNCE_MS).toBeLessThanOrEqual(400);
    expect(DEFAULT_LIVE_SYNC_TIMING.diskDraftIdleMs).toBe(
      LIVE_SYNC_DISK_DRAFT_IDLE_MS,
    );
  });

  it("resolveLiveSyncTiming merges overrides", () => {
    expect(resolveLiveSyncTiming({ diskDraftIdleMs: 200 }).diskDraftIdleMs).toBe(
      200,
    );
  });
});
