/**
 * Project canvas-inspector flags (mirrors `.glassbox-studio/project.json`).
 */

export type ProjectCanvasInspectorConfig = {
  stripAttrs?: boolean;
};

/** Keep in sync with `.glassbox-studio/project.json` → canvasInspector. */
export const PROJECT_CANVAS_INSPECTOR: ProjectCanvasInspectorConfig = {
  stripAttrs: true,
};

/** Local ideal-stack preview hosts — keep authoring attrs + guest script. */
export function isDevSiteHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase();
  return (
    h === "127.0.0.1" ||
    h === "localhost" ||
    h === "[::1]" ||
    h === "::1" ||
    h.endsWith(".localhost")
  );
}

/**
 * Strip authoring attrs only for real prod (non-local) when config allows.
 * Studio Live (`as-preview`) and local ideal-stack preview keep instrumentation.
 */
export function shouldStripAuthoringAttrs(input: {
  isStudioPreview?: boolean;
  /** Local node/wrangler preview (127.0.0.1 / localhost). */
  isDevSite?: boolean;
  config?: ProjectCanvasInspectorConfig | null;
}): boolean {
  if (input.isStudioPreview || input.isDevSite) return false;
  const cfg = input.config ?? PROJECT_CANVAS_INSPECTOR;
  if (cfg.stripAttrs === false) return false;
  return true;
}
