/**
 * Project design-system → Tailwind v4 `@theme` / `:root` CSS.
 * BrowserUI-inspired: tokens JSON is the abstraction; no hand Tailwind config.
 */

export type TokenValue = string | number | TokenMap | TokenValue[];

export type TokenMap = { [key: string]: TokenValue };

export type DesignSystemTokens = {
  color?: TokenMap;
  /** Dark-mode color overrides — emitted as `.dark { --color-* }` after `@theme`. */
  colorDark?: TokenMap;
  space?: TokenMap;
  radius?: TokenMap;
  shadow?: TokenMap;
  breakpoint?: TokenMap;
  font?: TokenMap & {
    importUrl?: string;
    family?: TokenMap;
    size?: TokenMap;
    weight?: TokenMap;
    lineHeight?: TokenMap;
  };
  motion?: TokenMap;
};

export type DesignSystemDoc = {
  $schema?: string;
  version?: string;
  tokens: DesignSystemTokens;
};

const NAMESPACE_TO_PREFIX: Record<string, string> = {
  color: "color",
  space: "spacing",
  radius: "radius",
  shadow: "shadow",
  breakpoint: "breakpoint",
};

const FONT_LEAF_TO_PREFIX: Record<string, string> = {
  family: "font",
  size: "text",
  weight: "font-weight",
  lineHeight: "leading",
};

const MOTION_LEAF_TO_PREFIX: Record<string, string> = {
  duration: "duration",
  easing: "ease",
};

export type GenerateThemeOptions = {
  banner?: string;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function flatten(
  value: TokenValue | undefined,
  emit: (key: string, leaf: string | number) => void,
  prefix: string[] = [],
): void {
  if (value === undefined || value === null) return;
  if (typeof value === "string" || typeof value === "number") {
    emit(prefix.join("-"), value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => flatten(v, emit, [...prefix, String(i)]));
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    flatten(v as TokenValue, emit, [...prefix, k]);
  }
}

function formatLine(
  prefix: string,
  key: string,
  value: string | number,
): string {
  const sep = key === "" ? "" : "-";
  return `--${prefix}${sep}${key}: ${value};`;
}

function generateVars(tokens: DesignSystemTokens, skipKeys: Set<string> = new Set()): string[] {
  const out: string[] = [];

  for (const [namespace, value] of Object.entries(tokens)) {
    if (value === undefined || value === null) continue;
    if (skipKeys.has(namespace)) continue;
    if (namespace === "font" && isPlainObject(value)) {
      for (const [leaf, sub] of Object.entries(value)) {
        if (leaf === "importUrl") continue;
        const prefix = FONT_LEAF_TO_PREFIX[leaf] ?? `font-${leaf}`;
        flatten(sub as TokenValue, (key, leafValue) =>
          out.push(formatLine(prefix, key, leafValue)),
        );
      }
      continue;
    }
    if (namespace === "motion" && isPlainObject(value)) {
      for (const [leaf, sub] of Object.entries(value)) {
        const prefix = MOTION_LEAF_TO_PREFIX[leaf] ?? leaf;
        flatten(sub as TokenValue, (key, leafValue) =>
          out.push(formatLine(prefix, key, leafValue)),
        );
      }
      continue;
    }
    const prefix = NAMESPACE_TO_PREFIX[namespace] ?? namespace;
    flatten(value as TokenValue, (key, leafValue) =>
      out.push(formatLine(prefix, key, leafValue)),
    );
  }

  return out;
}

function generateDarkColorBlock(colorDark: TokenMap | undefined): string {
  if (!colorDark || !isPlainObject(colorDark)) return "";
  const lines: string[] = [];
  flatten(colorDark, (key, leafValue) =>
    lines.push(`  ${formatLine("color", key, leafValue)}`),
  );
  if (lines.length === 0) return "";
  return `\n.dark {\n${lines.join("\n")}\n}\n`;
}

/** Tailwind v4 `@theme` block from design-system tokens. */
export function generateTheme(
  design: DesignSystemDoc,
  opts: GenerateThemeOptions = {},
): string {
  const lines: string[] = [];
  if (opts.banner) lines.push(`/* ${opts.banner} */`);
  const importUrl = design.tokens.font?.importUrl;
  if (typeof importUrl === "string" && importUrl.trim()) {
    const safeUrl = importUrl.replace(/'/g, "%27").replace(/;/g, "%3B");
    lines.push(`@import url('${safeUrl}');`);
  }
  lines.push("@theme {");
  for (const line of generateVars(design.tokens, new Set(["colorDark"]))) {
    lines.push(`  ${line}`);
  }
  lines.push("}");
  return `${lines.join("\n")}\n${generateDarkColorBlock(design.tokens.colorDark as TokenMap | undefined)}`;
}

/** Plain `:root` vars (non-Tailwind / atlas preview). */
export function generateRootVars(
  design: DesignSystemDoc,
  opts: GenerateThemeOptions = {},
): string {
  const lines: string[] = [];
  if (opts.banner) lines.push(`/* ${opts.banner} */`);
  lines.push(":root {");
  for (const line of generateVars(design.tokens, new Set(["colorDark"]))) {
    lines.push(`  ${line}`);
  }
  lines.push("}");
  return `${lines.join("\n")}\n${generateDarkColorBlock(design.tokens.colorDark as TokenMap | undefined)}`;
}

export type TokenAtlasEntry = {
  path: string;
  cssVar: string;
  value: string;
  kind: "color" | "space" | "radius" | "shadow" | "font" | "other";
};

function kindForPath(path: string): TokenAtlasEntry["kind"] {
  if (path.startsWith("color.")) return "color";
  if (path.startsWith("space.")) return "space";
  if (path.startsWith("radius.")) return "radius";
  if (path.startsWith("shadow.")) return "shadow";
  if (path.startsWith("font.")) return "font";
  return "other";
}

function cssVarForTokenPath(pathParts: string[]): string {
  const [ns, leaf, ...rest] = pathParts;
  if (!ns) return "--token";
  if (ns === "font" && leaf) {
    const prefix = FONT_LEAF_TO_PREFIX[leaf] ?? `font-${leaf}`;
    const key = rest.join("-");
    return `--${prefix}${key ? `-${key}` : ""}`;
  }
  if (ns === "motion" && leaf) {
    const prefix = MOTION_LEAF_TO_PREFIX[leaf] ?? leaf;
    const key = rest.join("-");
    return `--${prefix}${key ? `-${key}` : ""}`;
  }
  const prefix = NAMESPACE_TO_PREFIX[ns] ?? ns;
  const key = [leaf, ...rest].filter(Boolean).join("-");
  return `--${prefix}${key ? `-${key}` : ""}`;
}

/** Flat list for Design System atlas UI. */
export function enumerateTokenAtlas(design: DesignSystemDoc): TokenAtlasEntry[] {
  const entries: TokenAtlasEntry[] = [];
  function walk(obj: TokenMap, path: string[]): void {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "importUrl" || k === "colorDark") continue;
      const next = [...path, k];
      if (typeof v === "string" || typeof v === "number") {
        const joined = next.join(".");
        entries.push({
          path: joined,
          cssVar: cssVarForTokenPath(next),
          value: String(v),
          kind: kindForPath(joined),
        });
        continue;
      }
      if (isPlainObject(v)) walk(v as TokenMap, next);
    }
  }
  walk(design.tokens as TokenMap, []);
  return entries;
}
