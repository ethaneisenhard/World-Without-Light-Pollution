/**
 * Optional Heroicon map for directory cards (hosts may pass their own icons).
 */

import { BoltIcon } from "@glassbox-studio/ui-icons/24/outline/bolt";
import { ChatBubbleLeftRightIcon } from "@glassbox-studio/ui-icons/24/outline/chat-bubble-left-right";
import { CircleStackIcon } from "@glassbox-studio/ui-icons/24/outline/circle-stack";
import { CloudIcon } from "@glassbox-studio/ui-icons/24/outline/cloud";
import { Cog6ToothIcon } from "@glassbox-studio/ui-icons/24/outline/cog-6-tooth";
import { CommandLineIcon } from "@glassbox-studio/ui-icons/24/outline/command-line";
import { FolderIcon } from "@glassbox-studio/ui-icons/24/outline/folder";
import { GlobeAltIcon } from "@glassbox-studio/ui-icons/24/outline/globe-alt";
import { PuzzlePieceIcon } from "@glassbox-studio/ui-icons/24/outline/puzzle-piece";
import { ServerIcon } from "@glassbox-studio/ui-icons/24/outline/server";

export type DirectoryIconId =
  | "puzzle"
  | "bolt"
  | "folder"
  | "server"
  | "cloud"
  | "cog"
  | "chat"
  | "circle-stack"
  | "globe"
  | "command-line";

const iconClass = "size-5 shrink-0";

export function directoryHeroIcon(
  id: DirectoryIconId | string,
  props: { class?: string } = {},
) {
  const p = { class: props.class ?? iconClass };
  switch (id) {
    case "bolt":
      return BoltIcon(p);
    case "folder":
      return FolderIcon(p);
    case "server":
      return ServerIcon(p);
    case "cloud":
      return CloudIcon(p);
    case "cog":
      return Cog6ToothIcon(p);
    case "chat":
      return ChatBubbleLeftRightIcon(p);
    case "circle-stack":
      return CircleStackIcon(p);
    case "globe":
      return GlobeAltIcon(p);
    case "command-line":
      return CommandLineIcon(p);
    case "puzzle":
    default:
      return PuzzlePieceIcon(p);
  }
}
