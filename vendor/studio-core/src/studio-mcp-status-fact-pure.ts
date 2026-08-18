/**
 * Honest Studio MCP status lines for peer harness context (no false "connected").
 */

export type StudioMcpFactInput =
  | {
      state: "ready";
      mcpUrl: string;
      toolCount: number;
      writtenPaths?: readonly string[];
    }
  | {
      state: "configured";
      mcpUrl: string;
      writtenPaths?: readonly string[];
      verifyError?: string;
    }
  | {
      state: "disabled";
      reason: string;
      mcpUrl?: string;
    }
  | {
      state: "unsupported";
      harness: string;
      reason: string;
      mcpUrl?: string;
    }
  | {
      state: "failed";
      reason: string;
      mcpUrl?: string;
    }
  | {
      state: "in-process";
    };

/** One-line (or short) fact for peer-minimal context inject. */
export function studioMcpStatusFact(input: StudioMcpFactInput): string {
  switch (input.state) {
    case "in-process":
      return "Studio tools are in-process for this harness (no HTTP MCP mount required).";
    case "ready": {
      const paths =
        input.writtenPaths && input.writtenPaths.length > 0
          ? ` Config: ${input.writtenPaths.join(", ")}.`
          : "";
      return `Studio MCP ready (${input.mcpUrl}) — tools/list ok (${input.toolCount} tools), server id glassbox-studio.${paths} Call tools when needed — including studio.vision.describe for image paths.`;
    }
    case "configured": {
      const paths =
        input.writtenPaths && input.writtenPaths.length > 0
          ? ` Config: ${input.writtenPaths.join(", ")}.`
          : "";
      const verify = input.verifyError?.trim()
        ? ` Verify pending/failed: ${input.verifyError.trim()}.`
        : " HTTP verify not confirmed.";
      return `Studio MCP configured (${input.mcpUrl}), server id glassbox-studio.${paths}${verify} Call tools when the CLI mounts glassbox-studio — including studio.vision.describe for image paths.`;
    }
    case "disabled":
      return `Studio MCP inject disabled (${input.reason}).${input.mcpUrl ? ` Endpoint would be ${input.mcpUrl}.` : ""}`;
    case "unsupported":
      return `Studio MCP Host file-inject not wired for harness "${input.harness}" (${input.reason}).${input.mcpUrl ? ` HTTP endpoint: ${input.mcpUrl} (server id glassbox-studio) if this peer can mount remote MCP.` : ""}`;
    case "failed":
      return `Studio MCP inject failed (${input.reason}).${input.mcpUrl ? ` Endpoint: ${input.mcpUrl}.` : ""}`;
    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}

/**
 * @deprecated Prefer {@link studioMcpStatusFact} with a real ensure/verify state.
 * Legacy URL-only claim — maps to "configured" (not verified).
 */
export function studioMcpConnectedFact(mcpUrl?: string | null): string {
  const url = mcpUrl?.trim();
  if (!url) {
    return studioMcpStatusFact({
      state: "configured",
      mcpUrl: "(unknown)",
      verifyError: "URL not provided; treat as unverified",
    });
  }
  return studioMcpStatusFact({
    state: "configured",
    mcpUrl: url,
    verifyError: "not verified this turn",
  });
}
