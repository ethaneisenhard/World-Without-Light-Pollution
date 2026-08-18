/**
 * Folder Finder lists the attached place's disk (Cloud or Local).
 * Same Host candidates API either way — Cloud is not a wall.
 * Copy: Cloud / Local / this computer — never Host.
 */

export type WorkspaceImportDiskFace =
  | "finder"
  | "switch-to-local"
  | "need-local-studio";

export type WorkspaceImportPlace = "cloud" | "local";

export function workspaceImportPlaceFromAttachId(
  attachId?: string | null,
): WorkspaceImportPlace {
  switch ((attachId ?? "").trim()) {
    case "laptop":
      return "local";
    default:
      return "cloud";
  }
}

export function resolveWorkspaceImportDiskFace(_input?: {
  attachId?: string | null;
  switchAllowed?: boolean;
}): WorkspaceImportDiskFace {
  return "finder";
}

export type WorkspaceImportDiskCopy = {
  title: string;
  hint: string;
  sidebarLabel: string;
  blockedTitle: string;
  blockedBody: string;
  switchCta: string | null;
};

const FINDER_HINT_LOCAL =
  "Open a folder to look inside. Use the menu on a folder to add it as a workspace. Folders already in workspaces show in color.";

const FINDER_HINT_CLOUD =
  "These folders live in the cloud. Open a folder to look inside. Use the menu on a folder to add it as a workspace. Folders already in workspaces show in color.";

export function workspaceImportDiskCopy(
  face: WorkspaceImportDiskFace,
  place: WorkspaceImportPlace = "local",
): WorkspaceImportDiskCopy {
  switch (face) {
    case "finder":
      switch (place) {
        case "cloud":
          return {
            title: "Folders in the cloud",
            hint: FINDER_HINT_CLOUD,
            sidebarLabel: "Cloud",
            blockedTitle: "",
            blockedBody: "",
            switchCta: null,
          };
        case "local":
          return {
            title: "Folders on this computer",
            hint: FINDER_HINT_LOCAL,
            sidebarLabel: "Computer",
            blockedTitle: "",
            blockedBody: "",
            switchCta: null,
          };
        default: {
          const _exhaustive: never = place;
          return _exhaustive;
        }
      }
    case "switch-to-local":
      return {
        title: "Folders on this computer",
        hint: "Cloud cannot see folders on this computer.",
        sidebarLabel: "Computer",
        blockedTitle: "Not connected to this computer",
        blockedBody:
          "Switch to Local to browse folders here and add them as workspaces.",
        switchCta: "Switch to Local",
      };
    case "need-local-studio":
      return {
        title: "Folders on this computer",
        hint: "Cloud cannot see folders on this computer.",
        sidebarLabel: "Computer",
        blockedTitle: "Not connected to this computer",
        blockedBody:
          "Open Glass Box Studio on this computer and choose Local to browse folders here.",
        switchCta: null,
      };
    default: {
      const _exhaustive: never = face;
      return _exhaustive;
    }
  }
}

export type WorkspaceImportLoadErrorKind = "missing" | "failed";

export function workspaceImportLoadErrorKind(
  raw?: string | null,
): WorkspaceImportLoadErrorKind | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  if (/\b404\b/.test(t) || /not found/i.test(t)) return "missing";
  return "failed";
}

export type WorkspaceImportFinderErrorCopy = {
  message: string;
  emptyLabel: string;
  switchCta: string | null;
};

export function workspaceImportFinderErrorCopy(input: {
  error?: string | null;
  place: WorkspaceImportPlace;
}): WorkspaceImportFinderErrorCopy | null {
  const kind = workspaceImportLoadErrorKind(input.error);
  if (!kind) return null;
  switch (input.place) {
    case "cloud":
      switch (kind) {
        case "missing":
          return {
            message: "Couldn't load folders from Cloud.",
            emptyLabel:
              "This Cloud copy cannot list folders yet. Switch to Local to browse this computer.",
            switchCta: "Switch to Local",
          };
        case "failed":
          return {
            message: "Couldn't load folders from Cloud.",
            emptyLabel: "Try again, or switch to Local to browse this computer.",
            switchCta: "Switch to Local",
          };
        default: {
          const _exhaustive: never = kind;
          return _exhaustive;
        }
      }
    case "local":
      switch (kind) {
        case "missing":
        case "failed":
          return {
            message: "Couldn't load folders on this computer.",
            emptyLabel: "Try again.",
            switchCta: null,
          };
        default: {
          const _exhaustive: never = kind;
          return _exhaustive;
        }
      }
    default: {
      const _exhaustive: never = input.place;
      return _exhaustive;
    }
  }
}
