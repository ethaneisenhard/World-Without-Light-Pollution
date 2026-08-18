export * from "./design-system.ts";
export * from "./token-path-pure.ts";
export * from "./atlas-html-pure.ts";

export type ThemeTokens = {
  version: 1;
  name: string;
  color: Record<string, Record<string, string>>;
  colorDark?: Record<string, Record<string, string>>;
  space: Record<string, string>;
  radius: Record<string, string>;
  font: {
    sans: string;
    mono: string;
    size: Record<string, string>;
  };
};

/** Flatten nested token object → CSS custom properties prefixed with --as- */
export function toCssVars(
  color: Record<string, Record<string, string>>,
  space: Record<string, string>,
  radius: Record<string, string>,
  font: ThemeTokens["font"],
): Record<string, string> {
  const vars: Record<string, string> = {};

  const walk = (obj: Record<string, unknown>, prefix: string) => {
    for (const [key, value] of Object.entries(obj)) {
      const path = `${prefix}-${key}`.replace(/_/g, "-");
      if (typeof value === "string") {
        vars[`--as-${path}`] = value;
      } else if (value && typeof value === "object") {
        walk(value as Record<string, unknown>, path);
      }
    }
  };

  walk(color, "color");
  walk(space, "space");
  walk(radius, "radius");
  walk({ sans: font.sans, mono: font.mono }, "font");
  walk(font.size, "font-size");

  return vars;
}

export function themeStyleBlock(tokens: ThemeTokens): string {
  const light = toCssVars(tokens.color, tokens.space, tokens.radius, tokens.font);
  const darkSource = tokens.colorDark ?? tokens.color;
  const dark = toCssVars(darkSource, tokens.space, tokens.radius, tokens.font);

  const lightLines = Object.entries(light).map(([k, v]) => `  ${k}: ${v};`);
  const darkLines = Object.entries(dark).map(([k, v]) => `  ${k}: ${v};`);

  return `:root {\n${lightLines.join("\n")}\n}\n\n.dark {\n${darkLines.join("\n")}\n}`;
}
