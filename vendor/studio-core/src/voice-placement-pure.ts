/**
 * Voice placement → HTTP/WS endpoints (Local loopback vs hosted public).
 */

export type VoicePlacement = "local" | "hosted";

export type VoicePlacementBases = {
  httpBase: string;
  wsUrl: string;
};

export function normalizeVoicePlacement(raw: unknown): VoicePlacement {
  return raw === "local" ? "local" : "hosted";
}

export function resolveVoicePlacementEndpoints(input: {
  placement: VoicePlacement;
  localBases: VoicePlacementBases;
  hostedBases: VoicePlacementBases | null;
}): VoicePlacementBases & { ok: boolean; reason?: string } {
  switch (input.placement) {
    case "local":
      return { ...input.localBases, ok: true };
    case "hosted": {
      const hosted = input.hostedBases;
      if (!hosted?.httpBase?.trim() || !hosted?.wsUrl?.trim()) {
        return {
          httpBase: "",
          wsUrl: "",
          ok: false,
          reason: "Cloud Voice URL missing — sign in or set hosted bases",
        };
      }
      return {
        httpBase: hosted.httpBase.replace(/\/+$/, ""),
        wsUrl: hosted.wsUrl,
        ok: true,
      };
    }
    default: {
      const _exhaustive: never = input.placement;
      return _exhaustive;
    }
  }
}

/** Shell Host attach id → Voice placement (desk/cloud → hosted). */
export function voicePlacementFromHostAttachId(
  hostId: string | null | undefined,
): VoicePlacement {
  const h = (hostId ?? "").trim().toLowerCase();
  if (h === "laptop" || h === "local") return "local";
  return "hosted";
}
