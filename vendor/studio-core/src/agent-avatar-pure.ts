/**
 * Agent face — bot shape/color, pet, upload, or generate look.
 */

export const AGENT_AVATAR_KINDS = [
  "bot",
  "generate",
  "upload",
  "pet",
] as const;

export type AgentAvatarKind = (typeof AGENT_AVATAR_KINDS)[number];

export const AGENT_BOT_SHAPES = [
  "circle",
  "blob",
  "square",
  "stadium",
  "triangle",
  "hexagon",
  "cloud",
  "drop",
] as const;

export type AgentBotShape = (typeof AGENT_BOT_SHAPES)[number];

export const AGENT_BOT_COLORS = [
  { id: "white", swatchClass: "bg-white", inkClass: "text-zinc-200" },
  { id: "brown", swatchClass: "bg-amber-800", inkClass: "text-amber-800" },
  { id: "red", swatchClass: "bg-red-500", inkClass: "text-red-500" },
  { id: "orange", swatchClass: "bg-orange-500", inkClass: "text-orange-500" },
  { id: "teal", swatchClass: "bg-teal-500", inkClass: "text-teal-500" },
  { id: "sky", swatchClass: "bg-sky-400", inkClass: "text-sky-400" },
  { id: "blue", swatchClass: "bg-blue-600", inkClass: "text-blue-600" },
  { id: "purple", swatchClass: "bg-violet-500", inkClass: "text-violet-500" },
  { id: "pink", swatchClass: "bg-pink-400", inkClass: "text-pink-400" },
  { id: "gray", swatchClass: "bg-zinc-400", inkClass: "text-zinc-400" },
] as const;

export type AgentBotColorId = (typeof AGENT_BOT_COLORS)[number]["id"];

export type AgentAvatar =
  | { kind: "bot"; shape: AgentBotShape; color: AgentBotColorId }
  | { kind: "generate"; prompt: string; shape: AgentBotShape; color: AgentBotColorId }
  | { kind: "upload"; imageDataUrl: string }
  | { kind: "pet"; petId: string };

export const DEFAULT_AGENT_AVATAR: AgentAvatar = {
  kind: "bot",
  shape: "circle",
  color: "orange",
};

export function isAgentAvatarKind(raw: unknown): raw is AgentAvatarKind {
  return (
    typeof raw === "string" &&
    (AGENT_AVATAR_KINDS as readonly string[]).includes(raw)
  );
}

export function parseAgentBotShape(raw: unknown): AgentBotShape {
  if (
    typeof raw === "string" &&
    (AGENT_BOT_SHAPES as readonly string[]).includes(raw)
  ) {
    return raw as AgentBotShape;
  }
  return DEFAULT_AGENT_AVATAR.shape;
}

export function parseAgentBotColor(raw: unknown): AgentBotColorId {
  if (
    typeof raw === "string" &&
    AGENT_BOT_COLORS.some((c) => c.id === raw)
  ) {
    return raw as AgentBotColorId;
  }
  return DEFAULT_AGENT_AVATAR.color;
}

export function agentBotColorInkClass(id: AgentBotColorId): string {
  return AGENT_BOT_COLORS.find((c) => c.id === id)?.inkClass ?? "text-orange-500";
}

export function hashPromptToBotLook(prompt: string): {
  shape: AgentBotShape;
  color: AgentBotColorId;
} {
  const text = prompt.trim().toLowerCase();
  let n = 0;
  for (let i = 0; i < text.length; i += 1) {
    n = (n * 31 + text.charCodeAt(i)) >>> 0;
  }
  const shape = AGENT_BOT_SHAPES[n % AGENT_BOT_SHAPES.length] ?? "circle";
  const color =
    AGENT_BOT_COLORS[(n >>> 8) % AGENT_BOT_COLORS.length]?.id ?? "orange";
  return { shape, color };
}

export function normalizeAgentAvatar(raw: unknown): AgentAvatar {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_AGENT_AVATAR };
  const rec = raw as Record<string, unknown>;
  const kind = isAgentAvatarKind(rec.kind) ? rec.kind : "bot";
  switch (kind) {
    case "pet": {
      const petId =
        typeof rec.petId === "string" && rec.petId.trim()
          ? rec.petId.trim()
          : "airring";
      return { kind: "pet", petId };
    }
    case "upload": {
      const imageDataUrl =
        typeof rec.imageDataUrl === "string" &&
        rec.imageDataUrl.startsWith("data:image/")
          ? rec.imageDataUrl
          : "";
      if (!imageDataUrl) return { ...DEFAULT_AGENT_AVATAR };
      return { kind: "upload", imageDataUrl };
    }
    case "generate": {
      const prompt =
        typeof rec.prompt === "string" ? rec.prompt.trim().slice(0, 240) : "";
      const look = prompt
        ? hashPromptToBotLook(prompt)
        : {
            shape: parseAgentBotShape(rec.shape),
            color: parseAgentBotColor(rec.color),
          };
      return { kind: "generate", prompt, ...look };
    }
    case "bot":
      return {
        kind: "bot",
        shape: parseAgentBotShape(rec.shape),
        color: parseAgentBotColor(rec.color),
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function parseAgentDescription(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().slice(0, 500);
  return text || null;
}
