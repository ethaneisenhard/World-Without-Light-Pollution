/**
 * Parse Hermes Host config for Studio picker (provider/model + Cursor-via-Hermes detect).
 * Pure — no I/O.
 *
 * Model menu SoT: `~/.hermes/provider_models_cache.json` (filled by `hermes model`
 * / provider `/v1/models`), filtered by `auth.json` credential_pool when present.
 */

import type { ChatModelOption } from "./chat-model-pure.js";

export const DEFAULT_HERMES_CHAT_MODEL = "claude-haiku-4-5";

export type HermesConfigSnapshot = {
  provider: string | null;
  model: string | null;
  baseUrl: string | null;
  /** True when Host looks configured to route Hermes → Cursor. */
  cursorViaHermes: boolean;
  cursorViaHermesReasons: string[];
};

export type HermesModelSelection = {
  provider?: string;
  model: string;
};

/** provider → model ids from Hermes `provider_models_cache.json`. */
export type HermesProviderModels = Readonly<
  Record<string, readonly string[]>
>;

/** `provider::model` or bare model id. */
export function parseHermesModelSelection(
  requested: string | null | undefined,
): HermesModelSelection {
  const t = (requested ?? "").trim();
  if (!t) return { model: DEFAULT_HERMES_CHAT_MODEL };
  const sep = t.indexOf("::");
  if (sep > 0) {
    const provider = t.slice(0, sep).trim();
    const model = t.slice(sep + 2).trim();
    if (provider && model) return { provider, model };
  }
  return { model: t };
}

export function formatHermesModelId(input: {
  provider?: string | null;
  model: string;
}): string {
  const model = input.model.trim();
  const provider = input.provider?.trim();
  if (provider) return `${provider}::${model}`;
  return model;
}

/**
 * Hermes disk cache shape:
 * `{ "anthropic": { "fp", "at", "models": ["…"] }, … }`
 * Also accepts `{ "anthropic": ["…"] }` for tests.
 */
export function parseHermesProviderModelsCache(
  raw: unknown,
): Record<string, string[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string[]> = {};
  for (const [provider, entry] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    const p = provider.trim();
    if (!p) continue;
    let modelsRaw: unknown = entry;
    if (
      entry &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      "models" in entry
    ) {
      modelsRaw = (entry as { models: unknown }).models;
    }
    if (!Array.isArray(modelsRaw)) continue;
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const m of modelsRaw) {
      if (typeof m !== "string") continue;
      const id = m.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    if (ids.length > 0) out[p] = ids;
  }
  return out;
}

/**
 * Providers the user has credentials for — `auth.json` → `credential_pool` keys.
 */
export function parseHermesConfiguredProviders(raw: unknown): string[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const pool = (raw as { credential_pool?: unknown }).credential_pool;
  if (!pool || typeof pool !== "object" || Array.isArray(pool)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const key of Object.keys(pool)) {
    const p = key.trim();
    if (!p || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

/**
 * Lightweight YAML peek — enough for model.provider / model.default / base_url
 * and coarse Cursor-via-Hermes signals. Not a full YAML parser.
 */
export function parseHermesConfigYaml(text: string): HermesConfigSnapshot {
  const src = text.replace(/\r\n/g, "\n");
  const nested = parseNestedModelBlock(src);

  const provider =
    nested.provider ||
    matchYamlScalar(src, /^[ \t]*provider:[ \t]*["']?([^"'\n#]+)/m) ||
    matchYamlScalar(src, /^[ \t]*model\.provider:[ \t]*["']?([^"'\n#]+)/m);

  // Hermes canonical key is `model.default` (bare `model` redirects there).
  const model =
    nested.defaultModel ||
    nested.model ||
    matchYamlScalar(src, /^[ \t]*model\.default:[ \t]*["']?([^"'\n#]+)/m) ||
    matchFlatTopLevelModel(src);

  const baseUrl =
    nested.baseUrl ||
    matchYamlScalar(src, /^[ \t]*base_url:[ \t]*["']?([^"'\n#]+)/m) ||
    matchYamlScalar(src, /^[ \t]*model\.base_url:[ \t]*["']?([^"'\n#]+)/m);

  const reasons: string[] = [];
  const providerLc = (provider ?? "").toLowerCase();
  if (
    providerLc === "cursor" ||
    providerLc === "cursor_agent" ||
    providerLc === "cursor-agent"
  ) {
    reasons.push(`model.provider=${provider}`);
  }
  const baseLc = (baseUrl ?? "").toLowerCase();
  if (
    baseLc.includes("cursor") ||
    baseLc.includes(":8765") ||
    baseLc.includes("composer")
  ) {
    reasons.push(`base_url suggests Cursor bridge (${baseUrl})`);
  }
  if (/cursor[_-]?composer|cursor[_-]?agent|cursor-sdk/i.test(src)) {
    reasons.push("config mentions Cursor bridge/plugin");
  }

  return {
    provider: provider?.trim() || null,
    model: model?.trim() || null,
    baseUrl: baseUrl?.trim() || null,
    cursorViaHermes: reasons.length > 0,
    cursorViaHermesReasons: reasons,
  };
}

/** Plugin dir names that mean Cursor-via-Hermes is installed. */
export function hermesPluginSuggestsCursor(
  pluginNames: readonly string[],
): boolean {
  return pluginNames.some((n) => {
    const s = n.toLowerCase();
    return (
      s.includes("cursor") ||
      s.includes("composer") ||
      s === "cursor-composer" ||
      s === "cursor_agent"
    );
  });
}

/**
 * Build Studio Hermes model picker options from Host Hermes install.
 * Prefer live `provider_models_cache` (+ credential_pool filter); fall back
 * only when cache is empty.
 */
export function buildHermesModelOptions(input: {
  snapshot: HermesConfigSnapshot;
  cursorViaHermes: boolean;
  cursorModels?: readonly ChatModelOption[] | null;
  providerModels?: HermesProviderModels | null;
  configuredProviders?: readonly string[] | null;
}): ChatModelOption[] {
  const out: ChatModelOption[] = [];
  const seen = new Set<string>();
  const push = (id: string, label: string) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push({ id, label });
  };

  const currentModel = input.snapshot.model || DEFAULT_HERMES_CHAT_MODEL;
  const currentProvider = input.snapshot.provider;
  const currentId = formatHermesModelId({
    provider: currentProvider,
    model: currentModel,
  });
  push(
    currentId,
    currentProvider
      ? `Current · ${titleProvider(currentProvider)} / ${currentModel}`
      : `Current · ${currentModel}`,
  );

  const cache = input.providerModels ?? {};
  const cacheProviders = Object.keys(cache);
  const configured = (input.configuredProviders ?? [])
    .map((p) => p.trim())
    .filter(Boolean);

  const providers =
    configured.length > 0
      ? configured.filter((p) => (cache[p]?.length ?? 0) > 0)
      : cacheProviders;

  // Prefer current provider first when listing.
  const ordered = orderProviders(providers, currentProvider);

  const cursorPrefix = input.cursorViaHermes
    ? "Cursor via Hermes"
    : "Cursor (start bridge)";

  for (const provider of ordered) {
    const ids =
      provider.toLowerCase() === "cursor" && input.cursorModels?.length
        ? input.cursorModels.map((m) => m.id)
        : (cache[provider] ?? []);
    const labelById = new Map(
      (input.cursorModels ?? []).map((m) => [m.id, m.label] as const),
    );
    for (const model of ids) {
      const id = formatHermesModelId({ provider, model });
      if (provider.toLowerCase() === "cursor") {
        const face = labelById.get(model) || model;
        push(id, `${cursorPrefix} · ${face}`);
        continue;
      }
      push(id, `${titleProvider(provider)} · ${model}`);
    }
  }

  // Cursor configured but missing from cache — still offer CLI / fallback rows.
  const hasCursorProvider = ordered.some((p) => p.toLowerCase() === "cursor");
  if (!hasCursorProvider) {
    const cursorList = input.cursorModels?.length
      ? input.cursorModels
      : ([
          { id: "composer-2.5", label: "Composer 2.5" },
          { id: "composer-fast", label: "Composer Fast" },
          { id: "auto", label: "Auto" },
        ] as const);
    const cursorConfigured =
      configured.some((p) => p.toLowerCase() === "cursor") ||
      input.cursorViaHermes;
    if (cursorConfigured || cacheProviders.length === 0) {
      for (const m of cursorList) {
        push(
          formatHermesModelId({ provider: "cursor", model: m.id }),
          `${cursorPrefix} · ${m.label}`,
        );
      }
    }
  }

  // No Hermes cache yet — thin static fallback so picker isn't empty.
  if (cacheProviders.length === 0 && ordered.length === 0) {
    for (const [provider, model, label] of HERMES_STATIC_FALLBACK) {
      push(formatHermesModelId({ provider, model }), label);
    }
  }

  return out;
}

/** Last-resort ids when Host has no provider_models_cache yet. */
const HERMES_STATIC_FALLBACK = [
  ["anthropic", "claude-haiku-4-5", "Anthropic · claude-haiku-4-5"],
  ["anthropic", "claude-sonnet-4-5", "Anthropic · claude-sonnet-4-5"],
  ["deepseek", "deepseek-v4-flash", "DeepSeek · deepseek-v4-flash"],
  ["deepseek", "deepseek-v4-pro", "DeepSeek · deepseek-v4-pro"],
] as const;

function orderProviders(
  providers: readonly string[],
  currentProvider: string | null | undefined,
): string[] {
  const cur = currentProvider?.trim().toLowerCase() ?? "";
  const rest = [...providers].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  if (!cur) return rest;
  const head = rest.filter((p) => p.toLowerCase() === cur);
  const tail = rest.filter((p) => p.toLowerCase() !== cur);
  return [...head, ...tail];
}

function titleProvider(provider: string): string {
  switch (provider.trim().toLowerCase()) {
    case "anthropic":
      return "Anthropic";
    case "deepseek":
      return "DeepSeek";
    case "cursor":
      return "Cursor";
    case "copilot":
      return "Copilot";
    case "openrouter":
      return "OpenRouter";
    case "nous":
      return "Nous";
    case "openai":
      return "OpenAI";
    case "openai-codex":
      return "OpenAI Codex";
    case "ollama":
      return "Ollama";
    default:
      return provider.trim();
  }
}

function matchYamlScalar(src: string, re: RegExp): string | null {
  const m = re.exec(src);
  return m?.[1]?.trim() || null;
}

/** Flat `model: name` at column 0 only — avoid matching nested `model:` keys. */
function matchFlatTopLevelModel(src: string): string | null {
  const m = /^model:[ \t]*["']?([^"'\n#]+)/m.exec(src);
  return m?.[1]?.trim() || null;
}

/**
 * `model:\n  default:\n  provider:\n  model:\n  base_url:` nested shape.
 * Prefer `default` over nested `model` (Hermes canonical).
 */
function parseNestedModelBlock(src: string): {
  provider: string | null;
  defaultModel: string | null;
  model: string | null;
  baseUrl: string | null;
} {
  const block = /^model:\s*\n((?:[ \t]+.+\n?)*)/m.exec(src);
  if (!block) {
    return {
      provider: null,
      defaultModel: null,
      model: null,
      baseUrl: null,
    };
  }
  const inner = block[1]!;
  return {
    provider: matchYamlScalar(
      inner,
      /^[ \t]+provider:[ \t]*["']?([^"'\n#]+)/m,
    ),
    defaultModel: matchYamlScalar(
      inner,
      /^[ \t]+default:[ \t]*["']?([^"'\n#]+)/m,
    ),
    model: matchYamlScalar(inner, /^[ \t]+model:[ \t]*["']?([^"'\n#]+)/m),
    baseUrl: matchYamlScalar(
      inner,
      /^[ \t]+base_url:[ \t]*["']?([^"'\n#]+)/m,
    ),
  };
}
