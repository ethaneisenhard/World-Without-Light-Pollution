/**
 * Re-export pure from studio-core so hosts can import one package:
 * `@glassbox-studio/components/directory` (pure + remix view + class slots).
 */

export {
  clampDirectoryPage,
  filterDirectoryByCategory,
  filterDirectoryByQuery,
  paginateDirectory,
  type DirectoryNavGroup,
  type DirectoryPageResult,
} from "@glassbox-studio/studio-core/browser";
