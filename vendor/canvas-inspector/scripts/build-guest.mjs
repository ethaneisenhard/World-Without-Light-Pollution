import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = join(root, "dist", "guest-boot.js");
mkdirSync(dirname(outfile), { recursive: true });

await esbuild.build({
  entryPoints: [join(root, "src", "guest-boot-entry.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  outfile,
  logLevel: "info",
});

const marketingGuest = join(
  root,
  "..",
  "..",
  "..",
  "projects",
  "glassbox-studio-template",
  "public",
  "as-canvas-inspector.js",
);
copyFileSync(outfile, marketingGuest);

console.log("wrote", outfile);
console.log("copied", marketingGuest);
