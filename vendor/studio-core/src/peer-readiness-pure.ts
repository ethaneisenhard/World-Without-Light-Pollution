/**
 * Peer harness readiness projection — pure.
 * Host/env probes are injected; this module never reads process.env / fs.
 */

import { COMPOSER_HARNESS_IDS } from "./harness-policy-pure.js";

export type PeerReadinessStatus = "ready" | "needs-setup" | "unknown";

export type PeerReadinessProbe = {
  /** KODY_CHAT_URL or KODY_BASE_URL set and non-empty. */
  kodyChatUrlConfigured?: boolean;
  /** ANTHROPIC_API_KEY present. */
  anthropicApiKeyConfigured?: boolean;
  /** DEEPSEEK_API_KEY present. */
  deepseekApiKeyConfigured?: boolean;
  /** LITELLM_API_KEY (or master key) present. */
  litellmApiKeyConfigured?: boolean;
  /** Host CLI binary present (agent / cursor agent). */
  cursorCliPresent?: boolean;
  /** hermes CLI present. */
  hermesCliPresent?: boolean;
  /** grok CLI present. */
  grokCliPresent?: boolean;
};

export type PeerReadinessRow = {
  harnessId: string;
  status: PeerReadinessStatus;
  /** Short operator hint — glass-box: pick in AI when ready. */
  hint: string;
};

type PeerReadinessProjector = (probe: PeerReadinessProbe) => PeerReadinessRow;

const PEER_READINESS_PROJECTORS: Record<string, PeerReadinessProjector> = {
  cursor: (probe) => {
    if (probe.cursorCliPresent === true) {
      return {
        harnessId: "cursor",
        status: "ready",
        hint: "CLI on Host — pick Cursor in AI tab when ready.",
      };
    }
    if (probe.cursorCliPresent === false) {
      return {
        harnessId: "cursor",
        status: "needs-setup",
        hint: "Install Cursor agent CLI on Host, then pick Cursor in AI tab.",
      };
    }
    return {
      harnessId: "cursor",
      status: "unknown",
      hint: "Host has not probed Cursor CLI yet.",
    };
  },
  anthropic: (probe) => {
    if (probe.anthropicApiKeyConfigured === true) {
      return {
        harnessId: "anthropic",
        status: "ready",
        hint: "API key set — pick Anthropic in AI tab when ready.",
      };
    }
    if (probe.anthropicApiKeyConfigured === false) {
      return {
        harnessId: "anthropic",
        status: "needs-setup",
        hint: "Set ANTHROPIC_API_KEY on Host, then pick Anthropic in AI tab.",
      };
    }
    return {
      harnessId: "anthropic",
      status: "unknown",
      hint: "Host has not probed Anthropic key yet.",
    };
  },
  deepseek: (probe) => {
    if (probe.deepseekApiKeyConfigured === true) {
      return {
        harnessId: "deepseek",
        status: "ready",
        hint: "API key set — pick DeepSeek in AI tab when ready.",
      };
    }
    if (probe.deepseekApiKeyConfigured === false) {
      return {
        harnessId: "deepseek",
        status: "needs-setup",
        hint: "Set DEEPSEEK_API_KEY on Host, then pick DeepSeek in AI tab.",
      };
    }
    return {
      harnessId: "deepseek",
      status: "unknown",
      hint: "Host has not probed DeepSeek key yet.",
    };
  },
  litellm: (probe) => {
    if (probe.litellmApiKeyConfigured === true) {
      return {
        harnessId: "litellm",
        status: "ready",
        hint: "Gateway key set — pick LiteLLM in AI tab when ready.",
      };
    }
    if (probe.litellmApiKeyConfigured === false) {
      return {
        harnessId: "litellm",
        status: "needs-setup",
        hint: "Set LITELLM_API_KEY (+ LITELLM_BASE_URL) on Host, then pick LiteLLM.",
      };
    }
    return {
      harnessId: "litellm",
      status: "unknown",
      hint: "Host has not probed LiteLLM key yet.",
    };
  },
  kody: (probe) => {
    // Kody is an MCP plane (Settings → MCP tools), not a composer harness.
    if (probe.kodyChatUrlConfigured === true) {
      return {
        harnessId: "kody",
        status: "ready",
        hint: "KODY_BASE_URL set — default plane Studio + Kody injects /mcp.",
      };
    }
    if (probe.kodyChatUrlConfigured === false) {
      return {
        harnessId: "kody",
        status: "needs-setup",
        hint: "Set KODY_BASE_URL on Host, then enable Studio + Kody under Settings → MCP tools.",
      };
    }
    return {
      harnessId: "kody",
      status: "unknown",
      hint: "Host has not probed Kody MCP (KODY_BASE_URL) yet.",
    };
  },
  hermes: (probe) => {
    if (probe.hermesCliPresent === true) {
      return {
        harnessId: "hermes",
        status: "ready",
        hint: "CLI on Host — pick Hermes in AI tab when ready.",
      };
    }
    if (probe.hermesCliPresent === false) {
      return {
        harnessId: "hermes",
        status: "needs-setup",
        hint: "Install Hermes CLI on Host, then pick Hermes in AI tab.",
      };
    }
    return {
      harnessId: "hermes",
      status: "unknown",
      hint: "Host has not probed Hermes CLI yet.",
    };
  },
  grok: (probe) => {
    if (probe.grokCliPresent === true) {
      return {
        harnessId: "grok",
        status: "ready",
        hint: "CLI on Host — pick Grok in AI tab when ready.",
      };
    }
    if (probe.grokCliPresent === false) {
      return {
        harnessId: "grok",
        status: "needs-setup",
        hint: "Install Grok Build CLI on Host, then pick Grok in AI tab.",
      };
    }
    return {
      harnessId: "grok",
      status: "unknown",
      hint: "Host has not probed Grok CLI yet.",
    };
  },
};

/** Register or replace a projector (tests / future peers). */
export function registerPeerReadinessProjector(
  harnessId: string,
  projector: PeerReadinessProjector,
): void {
  PEER_READINESS_PROJECTORS[harnessId.trim()] = projector;
}

export function projectPeerReadinessRow(
  harnessId: string,
  probe: PeerReadinessProbe,
): PeerReadinessRow {
  const id = harnessId.trim();
  const projector = PEER_READINESS_PROJECTORS[id];
  if (!projector) {
    return {
      harnessId: id,
      status: "unknown",
      hint: `No readiness projector for "${id}".`,
    };
  }
  return projector(probe);
}

/** Composer peers in picker order. */
export function listPeerReadinessRows(
  probe: PeerReadinessProbe,
): PeerReadinessRow[] {
  return COMPOSER_HARNESS_IDS.map((id) => projectPeerReadinessRow(id, probe));
}

/** Build probe flags from env-like string map (Host adapter fills this). */
export function peerReadinessProbeFromEnv(env: {
  KODY_CHAT_URL?: string;
  KODY_BASE_URL?: string;
  ANTHROPIC_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  LITELLM_API_KEY?: string;
}): Pick<
  PeerReadinessProbe,
  | "kodyChatUrlConfigured"
  | "anthropicApiKeyConfigured"
  | "deepseekApiKeyConfigured"
  | "litellmApiKeyConfigured"
> {
  const kodyUrl =
    (env.KODY_CHAT_URL ?? "").trim() || (env.KODY_BASE_URL ?? "").trim();
  const anthropic = (env.ANTHROPIC_API_KEY ?? "").trim();
  const deepseek = (env.DEEPSEEK_API_KEY ?? "").trim();
  const litellm = (env.LITELLM_API_KEY ?? "").trim();
  return {
    kodyChatUrlConfigured: Boolean(kodyUrl),
    anthropicApiKeyConfigured: Boolean(anthropic),
    deepseekApiKeyConfigured: Boolean(deepseek),
    litellmApiKeyConfigured: Boolean(litellm),
  };
}

type CapabilityProbeState = {
  id: string;
  installed?: boolean;
  authOk?: boolean;
};

/**
 * Map capability plane runtime states → readiness probe.
 * CLI peers: ready when installed + authOk. Env/url peers: authOk.
 */
export function peerReadinessProbeFromCapabilityStates(
  states: readonly CapabilityProbeState[],
): PeerReadinessProbe {
  const by = new Map(states.map((s) => [s.id, s]));
  const flag = (id: string, mode: "cli" | "env"): boolean | undefined => {
    const s = by.get(id);
    if (!s) return undefined;
    if (mode === "env") return Boolean(s.authOk);
    return Boolean(s.installed && s.authOk);
  };
  const kodyFlag =
    flag("mcp:kody", "env") ?? flag("harness:kody", "env");
  return {
    kodyChatUrlConfigured: kodyFlag,
    anthropicApiKeyConfigured: flag("harness:anthropic", "env"),
    deepseekApiKeyConfigured: flag("harness:deepseek", "env"),
    cursorCliPresent: flag("harness:cursor", "cli"),
    hermesCliPresent: flag("harness:hermes", "cli"),
    grokCliPresent: flag("harness:grok", "cli"),
  };
}
