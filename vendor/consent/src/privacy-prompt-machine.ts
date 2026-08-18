import { assign, setup, type ActorRefFrom } from "xstate";

export type PrivacyPromptMode = "banner" | "customize" | "preferences";

export interface PrivacyPromptContext {
  mode: PrivacyPromptMode | null;
  hasStoredConsent: boolean;
}

export type PrivacyPromptEvent =
  | { type: "BOOT"; hasStoredConsent: boolean }
  | { type: "OPEN_BANNER" }
  | { type: "OPEN_CUSTOMIZE" }
  | { type: "OPEN_PREFERENCES" }
  | { type: "ACCEPT_ALL" }
  | { type: "REJECT_NON_ESSENTIAL" }
  | { type: "SAVE" }
  | { type: "CLOSE" };

export const privacyPromptMachine = setup({
  types: {} as {
    context: PrivacyPromptContext;
    events: PrivacyPromptEvent;
  },
  actions: {
    stashBoot: assign(({ event }) => {
      if (event.type !== "BOOT") return {};
      return { hasStoredConsent: event.hasStoredConsent };
    }),
    setMode: assign((_, params: { mode: PrivacyPromptMode | null }) => ({
      mode: params.mode,
    })),
    markStored: assign({ hasStoredConsent: true }),
  },
  guards: {
    needsBannerOnBoot: ({ event }) => event.type === "BOOT" && !event.hasStoredConsent,
    closeCustomizeWithoutStored: ({ context }) =>
      context.mode === "customize" && !context.hasStoredConsent,
  },
}).createMachine({
  id: "privacyPrompt",
  initial: "hidden",
  context: {
    mode: null,
    hasStoredConsent: false,
  },
  states: {
    hidden: {
      on: {
        BOOT: [
          { guard: "needsBannerOnBoot", target: "banner", actions: "stashBoot" },
          { actions: "stashBoot" },
        ],
        OPEN_PREFERENCES: {
          target: "preferences",
          actions: { type: "setMode", params: { mode: "preferences" } },
        },
      },
    },
    banner: {
      entry: { type: "setMode", params: { mode: "banner" } },
      on: {
        OPEN_CUSTOMIZE: {
          target: "customize",
          actions: { type: "setMode", params: { mode: "customize" } },
        },
        ACCEPT_ALL: {
          target: "hidden",
          actions: ["markStored", { type: "setMode", params: { mode: null } }],
        },
        REJECT_NON_ESSENTIAL: {
          target: "hidden",
          actions: ["markStored", { type: "setMode", params: { mode: null } }],
        },
        OPEN_PREFERENCES: {
          target: "preferences",
          actions: { type: "setMode", params: { mode: "preferences" } },
        },
      },
    },
    customize: {
      entry: { type: "setMode", params: { mode: "customize" } },
      on: {
        SAVE: {
          target: "hidden",
          actions: ["markStored", { type: "setMode", params: { mode: null } }],
        },
        CLOSE: [
          { guard: "closeCustomizeWithoutStored", target: "banner" },
          { target: "hidden", actions: { type: "setMode", params: { mode: null } } },
        ],
      },
    },
    preferences: {
      entry: { type: "setMode", params: { mode: "preferences" } },
      on: {
        SAVE: {
          target: "hidden",
          actions: ["markStored", { type: "setMode", params: { mode: null } }],
        },
        CLOSE: { target: "hidden", actions: { type: "setMode", params: { mode: null } } },
      },
    },
  },
});

export type PrivacyPromptActor = ActorRefFrom<typeof privacyPromptMachine>;

export function privacyPromptIsOpen(
  snapshot: ReturnType<PrivacyPromptActor["getSnapshot"]>,
): boolean {
  return !snapshot.matches("hidden");
}
