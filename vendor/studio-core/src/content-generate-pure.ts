import type { ProjectHosting } from "./types.js";

/** True when a disk write should trigger hosting.content_generate. */
export function shouldRunContentGenerate(
  filePath: string,
  hosting: Pick<ProjectHosting, "content_generate"> | null | undefined,
): boolean {
  const gen = hosting?.content_generate;
  if (!gen?.command || !Array.isArray(gen.args)) return false;
  const normalized = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const prefixes = gen.path_prefixes?.length
    ? gen.path_prefixes
    : ["content/"];
  return prefixes.some((prefix) => {
    const p = prefix.replace(/\\/g, "/");
    return normalized === p.replace(/\/$/, "") || normalized.startsWith(p.endsWith("/") ? p : `${p}/`) || normalized.startsWith(p);
  });
}
