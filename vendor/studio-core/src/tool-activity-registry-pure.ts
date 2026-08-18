/**
 * Project tool-start args → human title / subtitle / body for thinking modal.
 */

export type ToolActivityProjection = {
  title: string;
  subtitle?: string;
  body?: string;
};

type Projector = (input: {
  name: string;
  args: Record<string, unknown>;
}) => ToolActivityProjection | null;

function str(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t || undefined;
}

function firstString(
  args: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const k of keys) {
    const v = str(args[k]);
    if (v) return v;
  }
  return undefined;
}

function truncate(s: string, max = 160): string {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > max ? `${one.slice(0, max - 1)}…` : one;
}

function titleCaseTool(name: string): string {
  const raw = (name || "tool").trim();
  if (!raw) return "Tool";
  const parts = raw.split(/[./]/).filter(Boolean);
  const last = parts[parts.length - 1] ?? raw;
  return last
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ROWS: Array<{ match: RegExp; project: Projector }> = [
  {
    match: /shell|bash|terminal|run_command|exec/i,
    project: ({ args }) => {
      const cmd = firstString(args, ["command", "cmd", "script", "code"]);
      return {
        title: "Run command",
        subtitle: cmd ? truncate(cmd) : undefined,
        body: cmd,
      };
    },
  },
  {
    match: /read|files_read|file_read|open_file/i,
    project: ({ args }) => {
      const path = firstString(args, ["path", "file", "filePath", "target"]);
      return {
        title: "Read file",
        subtitle: path,
        body: path,
      };
    },
  },
  {
    match: /write|files_write|file_write|edit|apply_patch/i,
    project: ({ args }) => {
      const path = firstString(args, ["path", "file", "filePath", "target"]);
      return {
        title: "Write file",
        subtitle: path,
        body: path,
      };
    },
  },
  {
    match: /grep|search_content|rg\b/i,
    project: ({ args }) => {
      const pattern = firstString(args, ["pattern", "query", "regex"]);
      const path = firstString(args, ["path", "glob", "cwd"]);
      const subtitle = [pattern, path].filter(Boolean).join(" · ") || undefined;
      return { title: "Search codebase", subtitle, body: subtitle };
    },
  },
  {
    match: /glob|list_dir|find_files/i,
    project: ({ args }) => {
      const glob = firstString(args, ["glob", "pattern", "path", "query"]);
      return { title: "Find files", subtitle: glob, body: glob };
    },
  },
  {
    match: /tools\.search|tool_search/i,
    project: ({ args }) => {
      const q = firstString(args, ["query", "q", "search"]);
      return { title: "Search tools", subtitle: q, body: q };
    },
  },
  {
    match: /deploy\.(ship|run|verify)|deploy[_-]?(ship|run|verify)|wrangler\s*deploy/i,
    project: ({ name }) => {
      const n = name.toLowerCase();
      const kind = n.includes("verify")
        ? "verify"
        : n.includes("ship")
          ? "ship"
          : "run";
      switch (kind) {
        case "verify":
          return { title: "Check Cloud site" };
        case "ship":
          return { title: "Ship to Cloud" };
        case "run":
          return { title: "Deploy to Cloud" };
        default: {
          const _x: never = kind;
          return _x;
        }
      }
    },
  },
];

export function projectToolActivity(input: {
  name: string;
  input?: unknown;
}): ToolActivityProjection {
  const name = (input.name || "tool").trim() || "tool";
  const args =
    input.input && typeof input.input === "object"
      ? (input.input as Record<string, unknown>)
      : {};

  for (const row of ROWS) {
    if (!row.match.test(name)) continue;
    const hit = row.project({ name, args });
    if (hit) return hit;
  }

  const path = firstString(args, ["path", "file", "filePath"]);
  const proposalId = firstString(args, ["proposalId"]);
  const command = firstString(args, ["command", "cmd", "query", "pattern"]);
  const subtitle = path ?? proposalId ?? (command ? truncate(command) : undefined);
  return {
    title: titleCaseTool(name),
    subtitle,
    body: subtitle,
  };
}
