#!/usr/bin/env node
/**
 * design/design-system.json → theme.generated.css + design-system.generated.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

async function main() {
  const { generateTheme } = await import("@glassbox-studio/ui-tokens");
  const raw = readFileSync(join(root, "design/design-system.json"), "utf8");
  const design = JSON.parse(raw);
  const css = generateTheme(design, {
    banner: "Generated from design/design-system.json — do not edit by hand",
  });
  const cssOut = join(root, "src/styles/theme.generated.css");
  writeFileSync(cssOut, css);
  console.log(`wrote ${cssOut}`);

  const tsOut = join(root, "src/design/design-system.generated.ts");
  writeFileSync(
    tsOut,
    `/* Generated from design/design-system.json — do not edit by hand */\n` +
      `import type { DesignSystemDoc } from "@glassbox-studio/ui-tokens";\n` +
      `export const designSystem = ${JSON.stringify(design, null, 2)} as DesignSystemDoc;\n`,
  );
  console.log(`wrote ${tsOut}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
