#!/usr/bin/env node
import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const remixPkg = path.dirname(require.resolve("remix/package.json"));

await esbuild.build({
  entryPoints: [path.join(root, "client/design/entry.tsx")],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: path.join(root, "public/design-client.js"),
  jsx: "automatic",
  jsxImportSource: "remix/ui",
  sourcemap: true,
  alias: {
    "remix/ui/jsx-runtime": path.join(remixPkg, "dist/ui/jsx-runtime.js"),
  },
});

console.log("wrote public/design-client.js");
