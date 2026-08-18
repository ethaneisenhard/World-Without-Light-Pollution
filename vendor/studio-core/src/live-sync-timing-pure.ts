/**
 * Live Code → disk timing (IDE model).
 *
 * Studio writes the open file. Project Vite / generate watch owns reload.
 * No draft postMessage debounce on the preferred path.
 */

/** Legacy as-hmr/1 draft notify debounce (~1 frame). */
export const LIVE_SYNC_DRAFT_DEBOUNCE_MS = 16;

/** Disk persist while editing with Live open (IDE autosave). */
export const LIVE_SYNC_DISK_DRAFT_IDLE_MS = 350;

/** Disk persist when project has no Live HMR. */
export const LIVE_SYNC_DISK_SAVE_DEBOUNCE_MS = 350;

export type LiveSyncTiming = {
  draftDebounceMs: number;
  diskDraftIdleMs: number;
  diskSaveDebounceMs: number;
};

export const DEFAULT_LIVE_SYNC_TIMING: LiveSyncTiming = {
  draftDebounceMs: LIVE_SYNC_DRAFT_DEBOUNCE_MS,
  diskDraftIdleMs: LIVE_SYNC_DISK_DRAFT_IDLE_MS,
  diskSaveDebounceMs: LIVE_SYNC_DISK_SAVE_DEBOUNCE_MS,
};

export function resolveLiveSyncTiming(
  overrides?: Partial<LiveSyncTiming>,
): LiveSyncTiming {
  return { ...DEFAULT_LIVE_SYNC_TIMING, ...overrides };
}
