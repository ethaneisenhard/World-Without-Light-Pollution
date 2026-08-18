/**
 * Headless directory (nav · search · cards · pagination) — remix/ui.
 * Hosts pass Tailwind class maps (Studio chrome or project @theme).
 *
 * Pure helpers re-exported from `@glassbox-studio/studio-core` (no duplicate logic).
 */

export {
  clampDirectoryPage,
  filterDirectoryByCategory,
  filterDirectoryByQuery,
  paginateDirectory,
  type DirectoryNavGroup,
  type DirectoryPageResult,
} from "./directory-pure.js";

export {
  DIRECTORY_CLASS_DEFAULTS,
  mergeDirectoryClasses,
  type DirectoryClasses,
} from "./directory-classes.js";

export { renderDirectory, type DirectoryViewProps } from "./directory-view.js";

export {
  directoryHeroIcon,
  type DirectoryIconId,
} from "./directory-icons.js";
