/**
 * DBHub DSN helpers for project D1 / SQLite stand-in files.
 * @see https://dbhub.ai/config/command-line
 */

/** Build a DBHub SQLite DSN from a filesystem path (absolute preferred). */
export function buildDbhubSqliteDsn(filePath: string): string {
  const raw = filePath.trim();
  if (!raw) {
    throw new Error("buildDbhubSqliteDsn: empty path");
  }
  if (raw.startsWith("sqlite:")) return raw;

  const p = raw.replace(/\\/g, "/");
  // Windows absolute: C:/Users/...
  if (/^[A-Za-z]:\//.test(p)) {
    return `sqlite:///${p}`;
  }
  // Unix absolute
  if (p.startsWith("/")) {
    return `sqlite://${p}`;
  }
  // Relative to process cwd (project root when Studio attaches MCP)
  const rel = p.replace(/^\.\//, "");
  return `sqlite:///${rel}`;
}

/** Default local stand-in path for a D1 destination id (project-relative). */
export function defaultDbhubD1StandInPath(destinationId: string): string {
  const id = destinationId.trim() || "primary-d1";
  return `.data/${id}.sqlite`;
}

/** npx args for DBHub stdio MCP against a DSN. */
export function dbhubStdioNpxArgs(input: {
  dsn: string;
  id?: string;
}): string[] {
  const args = [
    "-y",
    "@bytebase/dbhub@latest",
    "--transport",
    "stdio",
    "--dsn",
    input.dsn,
  ];
  if (input.id?.trim()) {
    args.push("--id", input.id.trim());
  }
  return args;
}
