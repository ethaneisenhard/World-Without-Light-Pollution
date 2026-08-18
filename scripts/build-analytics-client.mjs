#!/usr/bin/env node
import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

await esbuild.build({
  entryPoints: [path.join(root, "client/analytics/entry.ts")],
  bundle: true,
  format: "iife",
  target: "es2022",
  outfile: path.join(root, "public/analytics-client.js"),
  platform: "browser",
  sourcemap: true,
});

console.log("wrote public/analytics-client.js");
