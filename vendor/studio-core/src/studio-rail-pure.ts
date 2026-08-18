/**
 * Left-rail Studio section (above Chats / Workspaces) — global destinations,
 * not project-scoped. Window ids match canvas kinds / View menu; service ids
 * open external Studio services (from `STUDIO_SERVICE_DEFS`).
 *
 * Global Chat lives in the pinned `global-chat` left-rail zone
 * (`left-rail-layout-pure`); it is not listed here.
 */

import type { ProjectRunStatus } from "./project-runtime-pure.js";
import {
  STUDIO_SERVICE_DEFS,
  getStudioServiceDef,
  listStudioServiceIds,
  resolveStudioServiceOpenUrl,
  type StudioRailServiceId,
} from "./studio-service-registry-pure.js";

export type StudioRailWindowId = "home" | "chat" | "messages" | "notifications";
export type StudioRailItemId = StudioRailWindowId | StudioRailServiceId;

export type StudioRailWindowItem = {
  kind: "window";
  id: StudioRailWindowId;
  label: string;
  /** Canvas / View-menu window kind to open + focus. */
  window: StudioRailWindowId;
};

export type StudioRailServiceItem = {
  kind: "service";
  id: StudioRailServiceId;
  label: string;
  serviceId: StudioRailServiceId;
  url: string;
};

export type StudioRailItem = StudioRailWindowItem | StudioRailServiceItem;

/** Pinned Global Chat destination (bottom left-rail zone). */
export const GLOBAL_CHAT_RAIL_ITEM: StudioRailWindowItem = {
  kind: "window",
  id: "chat",
  label: "Global Chat",
  window: "chat",
};

/** Service rail rows projected from the registry (order = def.order). */
export function studioServiceRailItems(): StudioRailServiceItem[] {
  return listStudioServiceIds().map((id) => {
    const def = STUDIO_SERVICE_DEFS[id];
    return {
      kind: "service" as const,
      id,
      label: def.railLabel,
      serviceId: id,
      url: resolveStudioServiceOpenUrl({ serviceId: id }) ?? def.defaultUrl,
    };
  });
}

export const N8N_STUDIO_RAIL_ITEM: StudioRailServiceItem =
  studioServiceRailItems().find((i) => i.id === "n8n")!;

export const VOICE_STUDIO_RAIL_ITEM: StudioRailServiceItem =
  studioServiceRailItems().find((i) => i.id === "voice")!;

export const LITELLM_STUDIO_RAIL_ITEM: StudioRailServiceItem =
  studioServiceRailItems().find((i) => i.id === "litellm")!;

export const MESSAGES_STUDIO_RAIL_ITEM: StudioRailWindowItem = {
  kind: "window",
  id: "messages",
  label: "Messages",
  window: "messages",
};

export const NOTIFICATIONS_STUDIO_RAIL_ITEM: StudioRailWindowItem = {
  kind: "window",
  id: "notifications",
  label: "Notifications",
  window: "notifications",
};

/** Studio section rows — Home + Notifications + services + Messages (Global Chat is its own zone). */
export const STUDIO_RAIL_ITEMS: readonly StudioRailItem[] = [
  { kind: "window", id: "home", label: "Home", window: "home" },
  NOTIFICATIONS_STUDIO_RAIL_ITEM,
  ...studioServiceRailItems(),
  MESSAGES_STUDIO_RAIL_ITEM,
];

/** Resolve Studio or Global Chat rail item by id. */
export function resolveStudioRailItem(
  id: StudioRailItemId,
): StudioRailItem | undefined {
  if (id === "chat") return GLOBAL_CHAT_RAIL_ITEM;
  return STUDIO_RAIL_ITEMS.find((i) => i.id === id);
}

/** Status tooltip for Studio service rows (vs workspace “Dev server …”). */
export function studioServiceStatusTitle(
  serviceId: StudioRailServiceId,
  status: ProjectRunStatus,
): string {
  const name = getStudioServiceDef(serviceId)?.label ?? serviceId;
  if (status === "running") return `${name} running`;
  if (status === "starting") return `${name} starting`;
  if (status === "error") return `${name} failed`;
  return `${name} off`;
}
