/**
 * Project Studio mcp.servers row → Hermes config.yaml mcp_servers entry (pure).
 */

import {
  resolveMcpServerAuthKind,
  type StudioMcpServerConfig,
} from "./studio-config-pure.js";

function yamlQuote(s: string): string {
  return JSON.stringify(s);
}

function indentLines(lines: string[], spaces: number): string {
  const pad = " ".repeat(spaces);
  return lines.map((l) => (l.length ? `${pad}${l}` : l)).join("\n");
}

/**
 * One Hermes `mcp_servers.<id>:` block (2-space key indent under mcp_servers).
 * Does not include the `mcp_servers:` parent key.
 */
export function studioMcpServerToHermesYamlEntry(
  server: StudioMcpServerConfig,
): string {
  const id = server.id.trim() || "unnamed";
  const lines: string[] = [];
  const auth = resolveMcpServerAuthKind(server);

  if (server.kind === "stdio") {
    if (server.command?.trim()) {
      lines.push(`command: ${yamlQuote(server.command.trim())}`);
    }
    if (server.args?.length) {
      lines.push("args:");
      for (const a of server.args) {
        lines.push(`  - ${yamlQuote(a)}`);
      }
    }
  } else {
    const url = (server.url ?? "").replace(/\/+$/, "");
    if (url) lines.push(`url: ${yamlQuote(url)}`);
  }

  lines.push(`enabled: ${server.enabled !== false}`);

  switch (auth) {
    case "oauth":
      lines.push("auth: oauth");
      break;
    case "bearer-env":
      if (server.authHeaderEnv?.trim()) {
        lines.push("headers:");
        lines.push(
          `  Authorization: ${yamlQuote(`Bearer \${${server.authHeaderEnv.trim()}}`)}`,
        );
      }
      break;
    case "none":
      break;
    default: {
      const _exhaustive: never = auth;
      return _exhaustive;
    }
  }

  const tools = server.tools;
  if (tools) {
    const toolLines: string[] = [];
    if (tools.include?.length) {
      toolLines.push("include:");
      for (const name of tools.include) {
        toolLines.push(`  - ${yamlQuote(name)}`);
      }
    }
    if (tools.exclude?.length && !tools.include?.length) {
      toolLines.push("exclude:");
      for (const name of tools.exclude) {
        toolLines.push(`  - ${yamlQuote(name)}`);
      }
    }
    if (typeof tools.resources === "boolean") {
      toolLines.push(`resources: ${tools.resources}`);
    }
    if (typeof tools.prompts === "boolean") {
      toolLines.push(`prompts: ${tools.prompts}`);
    }
    if (toolLines.length) {
      lines.push("tools:");
      lines.push(indentLines(toolLines, 2));
    }
  }

  return `  ${id}:\n${indentLines(lines, 4)}`;
}
