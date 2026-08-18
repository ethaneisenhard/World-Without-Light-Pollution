/**
 * studio.vision.describe — parse/validate inputs (no I/O).
 */

export type VisionDescribeInput = {
  path: string;
  /** Optional focus question for the vision model. */
  question?: string;
};

export function mediaTypeFromImagePath(relPath: string): string {
  const lower = relPath.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  return "image/png";
}

export function parseVisionDescribeInput(
  raw: unknown,
): { ok: true; input: VisionDescribeInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "input must be an object with path" };
  }
  const o = raw as Record<string, unknown>;
  const pathRaw = typeof o.path === "string" ? o.path.trim() : "";
  if (!pathRaw) {
    return { ok: false, error: "path required (project-relative image file)" };
  }
  if (pathRaw.includes("..") || pathRaw.startsWith("/")) {
    return {
      ok: false,
      error: "path must be project-relative (no .. or absolute)",
    };
  }
  const question =
    typeof o.question === "string" && o.question.trim()
      ? o.question.trim().slice(0, 500)
      : undefined;
  return { ok: true, input: { path: pathRaw, question } };
}

export function visionDescribeSystemPrompt(): string {
  return "Describe the image for a coding agent. Be concrete about UI layout, text, colors, and errors. Stay under 400 words.";
}
