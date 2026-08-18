#!/usr/bin/env node
/**
 * Sync Heroicons glyph JSON into this package.
 *
 * Outline: copy from sibling BrowserUI `@browserui/icons` catalog (preferred),
 *   or fall back to parsing SVGs from a local heroicons checkout / tarball.
 * Solid: extract path data from `@heroicons/react/24/solid` if present,
 *   else skip (outline-only is enough for most Studio chrome).
 *
 * Usage:
 *   pnpm --filter @glassbox-studio/ui-icons sync
 *   BROWSERUI_ROOT=~/BrowserUI pnpm --filter @glassbox-studio/ui-icons sync
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = path.join(root, "src/generated/heroicons");
const require = createRequire(import.meta.url);

function resolveBrowserUIIcons() {
  const env = process.env.BROWSERUI_ROOT;
  const candidates = [
    env ? path.join(env, "packages/icons/src/generated/heroicons/outline") : null,
    path.resolve(root, "../../../BrowserUI/packages/icons/src/generated/heroicons/outline"),
    path.resolve(root, "../../../../BrowserUI/packages/icons/src/generated/heroicons/outline"),
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) ?? null;
}

function syncOutlineFromBrowserUI() {
  const src = resolveBrowserUIIcons();
  if (!src) {
    console.warn("[ui-icons] BrowserUI outline catalog not found — keeping existing outline/");
    return false;
  }
  const dest = path.join(outRoot, "outline");
  mkdirSync(outRoot, { recursive: true });
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[ui-icons] outline ← ${src} (${readdirSync(dest).length} files)`);
  return true;
}

/** Pull solid glyphs from @heroicons/react while available (one-shot vendor). */
function syncSolidFromHeroiconsReact() {
  const candidates = [
    () => {
      const pkg = require.resolve("@heroicons/react/package.json", {
        paths: [
          root,
          path.resolve(root, "../../apps/studio"),
          path.resolve(root, "../.."),
        ],
      });
      return path.join(path.dirname(pkg), "24/solid");
    },
    () =>
      path.resolve(
        root,
        "../../apps/studio/node_modules/@heroicons/react/24/solid",
      ),
  ];
  let solidDir = null;
  for (const get of candidates) {
    try {
      const p = get();
      if (existsSync(p)) {
        solidDir = p;
        break;
      }
    } catch {
      /* try next */
    }
  }
  if (!solidDir) {
    console.warn("[ui-icons] @heroicons/react not found — skip solid sync");
    return false;
  }

  const dest = path.join(outRoot, "solid");
  mkdirSync(dest, { recursive: true });

  const files = readdirSync(solidDir).filter(
    (f) => f.endsWith("Icon.js") && !f.includes(".d."),
  );
  let count = 0;
  for (const file of files) {
    const src = readFileSync(path.join(solidDir, file), "utf8");
    const paths = [...src.matchAll(/d:\s*"([^"]+)"/g)].map((m) => m[1]);
    if (paths.length === 0) continue;
    const kebab = file
      .replace(/Icon\.js$/, "")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
      .toLowerCase();
    const glyphs = paths.map((d) => ({ tag: "path", attrs: { d } }));
    writeFileSync(
      path.join(dest, `${kebab}.json`),
      JSON.stringify(glyphs, null, 2) + "\n",
    );
    count++;
  }
  console.log(`[ui-icons] solid ← @heroicons/react/24/solid (${count} icons)`);
  return count > 0;
}

syncOutlineFromBrowserUI();
syncSolidFromHeroiconsReact();

const gen = spawnSync(process.execPath, [path.join(root, "scripts/generate-named.mjs")], {
  cwd: root,
  stdio: "inherit",
});
process.exit(gen.status ?? 1);
