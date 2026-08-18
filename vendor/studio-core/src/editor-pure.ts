/** Preferred local editors — open via URL scheme (no IDE embed). */
export type EditorAppId = "cursor" | "vscode" | "zed";

const EDITOR_SCHEMES: Record<EditorAppId, string> = {
  cursor: "cursor://file",
  vscode: "vscode://file",
  zed: "zed://file",
};

/** Join project root + relative path → absolute filesystem path. */
export function resolveAbsoluteProjectPath(
  projectRoot: string,
  relativePath: string,
): string {
  const root = projectRoot.replace(/\/+$/, "");
  const raw = relativePath.trim();
  // Already absolute (posix or Windows drive)
  if (raw.startsWith("/") || /^[A-Za-z]:[\\/]/.test(raw)) return raw.replace(/\\/g, "/");
  const rel = raw.replace(/^\/+/, "");
  if (!rel) return root;
  return `${root}/${rel}`;
}

/**
 * Deep-link to open a file in a desktop editor.
 * Cursor/VS Code: `{scheme}{absolutePath}:{line}` (path keeps leading `/`).
 */
export function buildEditorFileUrl(
  app: EditorAppId,
  absolutePath: string,
  line = 1,
): string {
  const scheme = EDITOR_SCHEMES[app];
  const normalized = absolutePath.replace(/\\/g, "/");
  const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${scheme}${withSlash}:${Math.max(1, line)}`;
}

export type OpenFileCanvasFlags = {
  code?: boolean;
  live?: boolean;
  design?: boolean;
};

/**
 * Which canvas windows to open when loading a file.
 * `preserveView` keeps Live/Design when already showing; still opens Code for edit.
 */
export function canvasFlagsForOpenFile(input: {
  preserveView: boolean;
  wantDesign: boolean;
  canLive: boolean;
  codeOpen: boolean;
  liveOpen: boolean;
  designOpen: boolean;
}): OpenFileCanvasFlags | null {
  if (input.wantDesign) {
    return { design: true, code: true };
  }
  if (input.canLive) {
    return { live: true, code: true };
  }
  if (!input.preserveView) {
    return { code: true };
  }
  // Files tree / preserveView — open Code for the file without closing Live.
  if (!input.codeOpen) {
    return { code: true };
  }
  return null;
}

/**
 * Which window should become active after opening a file.
 * Design → Design · Live preview path → Live · otherwise Code.
 */
export function focusKindForOpenFile(input: {
  wantDesign: boolean;
  canLive: boolean;
}): "design" | "live" | "code" {
  if (input.wantDesign) return "design";
  if (input.canLive) return "live";
  return "code";
}

/** Skip URL rewrite when path unchanged and a window already shows content. */
export function shouldSkipOpenFileUrlSync(input: {
  pathAlready: boolean;
  preserveView: boolean;
  canLive: boolean;
  wantDesign: boolean;
  codeOpen: boolean;
  liveOpen: boolean;
  designOpen: boolean;
}): boolean {
  if (!input.pathAlready || !input.preserveView) return false;
  if (input.canLive || input.wantDesign) return false;
  // Still need a URL write when Code is closed (flags will open it).
  if (!input.codeOpen) return false;
  return input.codeOpen || input.liveOpen || input.designOpen;
}

/**
 * Whether openFile should call focusCanvasTab after hydrate.
 * URL `focus=` (when that kind is open) wins over path restore — otherwise
 * `path=` + preserveView steals focus to Code on every reload.
 * `userOpen` (Files/Nav click) always activates — never open the file in the background.
 */
export function shouldActivateOpenFileFocus(input: {
  preserveView: boolean;
  /** From canvasFocusFromParams — null when absent or kind not open. */
  urlFocus: string | null | undefined;
  openFileFocus: string;
  /** User clicked a file in Files/Nav — always show Code/Live/Design. */
  userOpen?: boolean;
}): boolean {
  if (input.userOpen) return true;
  if (!input.preserveView) return true;
  const url = (input.urlFocus ?? "").trim();
  if (!url) return true;
  return url === input.openFileFocus;
}
