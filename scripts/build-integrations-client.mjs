#!/usr/bin/env node
/**
 * Bundle Integrations directory demo (shared @glassbox-studio/components/directory).
 * Separate from design sandbox client — keeps this entry lean.
 */
import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const remixPkg = path.dirname(require.resolve("remix/package.json"));

await esbuild.build({
  entryPoints: [path.join(root, "client/integrations/entry.tsx")],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: path.join(root, "public/integrations-client.js"),
  jsx: "automatic",
  jsxImportSource: "remix/ui",
  platform: "browser",
  sourcemap: true,
  alias: {
    "remix/ui/jsx-runtime": path.join(remixPkg, "dist/ui/jsx-runtime.js"),
    "@glassbox-studio/studio-core/browser": path.join(
      root,
      "../../packages/studio/studio-core/src/browser.ts",
    ),
    "@glassbox-studio/studio-core": path.join(
      root,
      "../../packages/studio/studio-core/src/browser.ts",
    ),
  },
});

console.log("wrote public/integrations-client.js");
