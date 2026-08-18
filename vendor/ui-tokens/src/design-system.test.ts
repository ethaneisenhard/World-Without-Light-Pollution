import { describe, expect, it } from "vitest";
import {
  enumerateTokenAtlas,
  generateRootVars,
  generateTheme,
  renderDesignSystemAtlasBody,
  setTokenAtPath,
  getTokenAtPath,
  type DesignSystemDoc,
} from "./index.js";

const sample: DesignSystemDoc = {
  version: "1.0.0",
  tokens: {
    color: {
      brand: { "500": "#0f766e" },
      ink: "#12151a",
    },
    space: { "4": "1rem" },
    radius: { md: "0.5rem" },
    font: {
      family: { sans: "DM Sans, sans-serif", display: "Fraunces, serif" },
      size: { base: "1.0625rem" },
    },
  },
};

describe("generateTheme", () => {
  it("emits Tailwind @theme vars from design-system tokens", () => {
    const css = generateTheme(sample, { banner: "generated" });
    expect(css).toContain("/* generated */");
    expect(css).toContain("@theme {");
    expect(css).toContain("--color-brand-500: #0f766e;");
    expect(css).toContain("--color-ink: #12151a;");
    expect(css).toContain("--spacing-4: 1rem;");
    expect(css).toContain("--radius-md: 0.5rem;");
    expect(css).toContain("--font-sans: DM Sans, sans-serif");
    expect(css).toContain("--text-base: 1.0625rem;");
  });
});

describe("generateRootVars", () => {
  it("emits :root block", () => {
    const css = generateRootVars(sample);
    expect(css).toContain(":root {");
    expect(css).toContain("--color-brand-500: #0f766e;");
  });
});

describe("enumerateTokenAtlas", () => {
  it("flattens tokens for atlas UI", () => {
    const atlas = enumerateTokenAtlas(sample);
    expect(atlas.some((e) => e.path === "color.brand.500" && e.kind === "color")).toBe(
      true,
    );
    expect(atlas.find((e) => e.path === "font.family.sans")?.cssVar).toBe(
      "--font-sans",
    );
  });
});

describe("setTokenAtPath / getTokenAtPath", () => {
  it("reads and writes nested paths immutably", () => {
    expect(getTokenAtPath(sample, "color.ink")).toBe("#12151a");
    const next = setTokenAtPath(sample, "color.ink", "#ff0000");
    expect(getTokenAtPath(next, "color.ink")).toBe("#ff0000");
    expect(getTokenAtPath(sample, "color.ink")).toBe("#12151a");
    expect(getTokenAtPath(next, "color.brand.500")).toBe("#0f766e");
  });
});

describe("renderDesignSystemAtlasBody", () => {
  it("renders BrowserUI-style swatches and editable hooks", () => {
    const html = renderDesignSystemAtlasBody(sample);
    expect(html).toContain("as-ds-swatch-grid");
    expect(html).toContain('data-as-token-path="color.ink"');
    expect(html).toContain("as-ds-scale-row");
    expect(html).toContain("Tokens");
  });
});
