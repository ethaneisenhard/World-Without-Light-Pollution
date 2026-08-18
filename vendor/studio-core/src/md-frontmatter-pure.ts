/**
 * Markdown frontmatter — parse/serialize for Studio Details view
 * (Inspector-style labeled fields for non-tech authors).
 */

export type FrontmatterFieldKind =
  | "text"
  | "textarea"
  | "date"
  | "select"
  | "checkbox"
  | "tags";

export type FrontmatterFieldDef = {
  key: string;
  label: string;
  help: string;
  kind: FrontmatterFieldKind;
  options?: readonly { value: string; label: string }[];
};

/** Default blog / page meta fields — human labels, not YAML keys. */
export const DEFAULT_FRONTMATTER_FIELDS: readonly FrontmatterFieldDef[] = [
  {
    key: "title",
    label: "Title",
    help: "Headline for this page or post",
    kind: "text",
  },
  {
    key: "description",
    label: "Summary",
    help: "Short blurb for lists, previews, and search",
    kind: "textarea",
  },
  {
    key: "date",
    label: "Publish date",
    help: "When this should appear as published",
    kind: "date",
  },
  {
    key: "categories",
    label: "Topics",
    help: "Comma-separated topics (e.g. product, launch)",
    kind: "tags",
  },
  {
    key: "visibility",
    label: "Who can see this",
    help: "Public = everyone; Members / Subscribers = gated",
    kind: "select",
    options: [
      { value: "public", label: "Everyone (public)" },
      { value: "members", label: "Signed-in members" },
      { value: "subscribers", label: "Subscribers only" },
    ],
  },
  {
    key: "draft",
    label: "Draft",
    help: "Keep off the live site until you’re ready",
    kind: "checkbox",
  },
  {
    key: "unlisted",
    label: "Hide from lists",
    help: "Reachable by link, but not shown in the blog index",
    kind: "checkbox",
  },
] as const;

export type ParsedMarkdownDoc = {
  /** Flat string map — lists joined with ", " */
  fields: Record<string, string>;
  body: string;
  /** True when a --- frontmatter block was present */
  hasFrontmatter: boolean;
};

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** Parse simple YAML-ish frontmatter (key: value lines; lists as comma or - item). */
export function parseMarkdownFrontmatter(source: string): ParsedMarkdownDoc {
  const text = source.replace(/^\uFEFF/, "");
  const match = text.match(FM_RE);
  if (!match) {
    return { fields: {}, body: text.replace(/^\n+/, ""), hasFrontmatter: false };
  }
  const fields = parseFrontmatterBlock(match[1]!);
  return {
    fields,
    body: match[2]!.replace(/^\n+/, ""),
    hasFrontmatter: true,
  };
}

export function parseFrontmatterBlock(block: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = block.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const listKey = line.match(/^([A-Za-z0-9_-]+):\s*$/);
    if (listKey) {
      const key = listKey[1]!;
      const items: string[] = [];
      i += 1;
      while (i < lines.length) {
        const item = lines[i]!.match(/^\s*-\s+(.+)$/);
        if (!item) break;
        items.push(item[1]!.trim());
        i += 1;
      }
      fields[key] = items.join(", ");
      continue;
    }
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      fields[key] = value;
    }
    i += 1;
  }
  return fields;
}

const BODY_H1_RE = /^#\s+(.+)$/m;

/** First ATX H1 in body markdown (page title for ideal-stack Live). */
export function extractBodyHeading(body: string): string | null {
  const match = body.match(BODY_H1_RE);
  const title = match?.[1]?.trim();
  return title ? title : null;
}

/** Set or insert the leading `# Title` while preserving the rest of the body. */
export function replaceBodyHeading(body: string, title: string): string {
  const nextTitle = title.trim();
  const text = body.replace(/^\n+/, "");
  if (!nextTitle) {
    if (!BODY_H1_RE.test(text)) return text;
    return text.replace(BODY_H1_RE, "").replace(/^\n+/, "");
  }
  if (BODY_H1_RE.test(text)) {
    return text.replace(BODY_H1_RE, `# ${nextTitle}`);
  }
  return text ? `# ${nextTitle}\n\n${text}` : `# ${nextTitle}\n`;
}

/** Merge field edits into a full markdown document (preserves body). */
export function applyFrontmatterFields(
  source: string,
  nextFields: Record<string, string>,
): string {
  const { body } = parseMarkdownFrontmatter(source);
  return serializeMarkdownFrontmatter(nextFields, body);
}

/**
 * Details form → full markdown. Title mirrors body H1 so Live / Write / Source
 * stay one document (ideal-stack reads `#`, blog reads frontmatter `title`).
 */
export function applyDetailsFields(
  source: string,
  nextFields: Record<string, string>,
): string {
  const { body } = parseMarkdownFrontmatter(source);
  const title = (nextFields.title ?? "").trim();
  const nextBody = replaceBodyHeading(body, title);
  return serializeMarkdownFrontmatter(nextFields, nextBody);
}

/** When body H1 changes (Write), keep frontmatter `title` aligned. */
export function syncFrontmatterTitleFromBody(
  fields: Record<string, string>,
  body: string,
): Record<string, string> {
  const h1 = extractBodyHeading(body);
  if (!h1 || fields.title === h1) return fields;
  return { ...fields, title: h1 };
}

/** WYSIWYM body edit → full doc (preserve YAML; mirror H1 → title). */
export function rejoinMarkdownDocument(
  fields: Record<string, string>,
  body: string,
): string {
  return serializeMarkdownFrontmatter(
    syncFrontmatterTitleFromBody(fields, body),
    body,
  );
}

export function serializeMarkdownFrontmatter(
  fields: Record<string, string>,
  body: string,
): string {
  const keys = Object.keys(fields).filter((k) => {
    const v = fields[k]?.trim() ?? "";
    if (!v) return false;
    if (v === "false" && (k === "draft" || k === "unlisted")) return false;
    return true;
  });
  // Stable order: known schema keys first, then extras.
  const known = DEFAULT_FRONTMATTER_FIELDS.map((f) => f.key);
  const ordered = [
    ...known.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !known.includes(k)).sort(),
  ];
  if (ordered.length === 0) {
    return body.replace(/^\n+/, "");
  }
  const lines: string[] = ["---"];
  for (const key of ordered) {
    const raw = fields[key]!.trim();
    if (key === "categories" || key === "tags") {
      const items = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length === 0) continue;
      if (items.length === 1) {
        lines.push(`${key}: ${items[0]}`);
      } else {
        lines.push(`${key}:`);
        for (const item of items) lines.push(`  - ${item}`);
      }
      continue;
    }
    if (key === "draft" || key === "unlisted") {
      const on = raw === "true" || raw === "yes" || raw === "1";
      if (on) lines.push(`${key}: true`);
      continue;
    }
    if (/[:\n#]/.test(raw) || raw.includes('"')) {
      lines.push(`${key}: "${raw.replaceAll('"', '\\"')}"`);
    } else {
      lines.push(`${key}: ${raw}`);
    }
  }
  lines.push("---", "");
  const bodyTrim = body.replace(/^\n+/, "");
  return bodyTrim ? `${lines.join("\n")}${bodyTrim}\n` : `${lines.join("\n")}`;
}

/** Values for the Details form from a document (+ empty known keys). */
export function frontmatterFormValues(
  source: string,
  fieldDefs: readonly FrontmatterFieldDef[] = DEFAULT_FRONTMATTER_FIELDS,
): Record<string, string> {
  const { fields, body } = parseMarkdownFrontmatter(source);
  const out: Record<string, string> = {};
  for (const def of fieldDefs) {
    out[def.key] = fields[def.key] ?? (def.kind === "checkbox" ? "false" : "");
  }
  for (const [k, v] of Object.entries(fields)) {
    if (!(k in out)) out[k] = v;
  }
  // Title: one value — body H1 wins when present (Live), else frontmatter.
  const fromH1 = extractBodyHeading(body);
  if (fromH1) out.title = fromH1;
  return out;
}

export function isCheckboxTruthy(value: string | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return v === "true" || v === "yes" || v === "1" || v === "on";
}
