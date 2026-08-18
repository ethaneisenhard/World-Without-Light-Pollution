import { describe, expect, it } from "vitest";
import {
  applyBrandPatchToDesign,
  applyPetPatchToDesign,
  applyShellColorPatchToDesign,
  coerceProjectShellForTheme,
  initialsFromLabel,
  parseBrandPatch,
  parsePetPatch,
  projectPetOverridesStudio,
  resolveEffectiveShellPet,
  resolveShellBrand,
  resolveShellPet,
  shellColorOverridesToCssVars,
  shellOverrideStyleBlock,
  STUDIO_PET_IDS,
  STUDIO_PET_OPTIONS,
  summarizeProjectShell,
} from "./design-pure.js";

describe("initialsFromLabel", () => {
  it("uses first letters of two words", () => {
    expect(initialsFromLabel("Demo Blog")).toBe("DB");
    expect(initialsFromLabel("Northline")).toBe("NO");
  });

  it("uses first two chars of a single token", () => {
    expect(initialsFromLabel("acme")).toBe("AC");
  });

  it("handles kebab / underscore", () => {
    expect(initialsFromLabel("demo-marketing")).toBe("DM");
    expect(initialsFromLabel("demo_blog")).toBe("DB");
  });
});

describe("resolveShellBrand", () => {
  it("prefers project name over brand name; keeps brand initials", () => {
    expect(
      resolveShellBrand({
        design: { brand: { name: "Studio Starter", initials: "SS" } },
        projectName: "Invention World",
        projectId: "invention-world",
      }),
    ).toEqual({
      displayName: "Invention World",
      initials: "SS",
      logo: undefined,
    });
  });

  it("falls back to brand name when project name missing", () => {
    expect(
      resolveShellBrand({
        design: { brand: { name: "Northline", initials: "NL" } },
        projectId: "demo-marketing",
      }),
    ).toEqual({
      displayName: "Northline",
      initials: "NL",
      logo: undefined,
    });
  });

  it("falls back to project name", () => {
    expect(
      resolveShellBrand({
        projectName: "Demo Blog",
        projectId: "demo-blog",
      }),
    ).toEqual({
      displayName: "Demo Blog",
      initials: "DB",
      logo: undefined,
    });
  });

  it("passes through logo URL", () => {
    expect(
      resolveShellBrand({
        design: { brand: { logo: "/marks/as.png", initials: "AS" } },
        projectId: "demo-blog",
      }),
    ).toEqual({
      displayName: "demo-blog",
      initials: "AS",
      logo: "/marks/as.png",
    });
  });

  it("passes through normalized emoji", () => {
    expect(
      resolveShellBrand({
        design: { brand: { initials: "IW", emoji: "🦊" } },
        projectId: "invention-world",
        projectName: "Invention World",
      }),
    ).toEqual({
      displayName: "Invention World",
      initials: "IW",
      logo: undefined,
      emoji: "🦊",
    });
  });
});

describe("applyBrandPatchToDesign", () => {
  it("sets and clears logo", () => {
    const withLogo = applyBrandPatchToDesign(
      {},
      { name: "Acme", initials: "AC", logo: "https://example.com/a.png" },
    );
    expect(withLogo.brand).toEqual({
      name: "Acme",
      initials: "AC",
      logo: "https://example.com/a.png",
    });
    const cleared = applyBrandPatchToDesign(withLogo, { logo: "" });
    expect(cleared.brand?.logo).toBeUndefined();
    expect(cleared.brand?.name).toBe("Acme");
  });

  it("sets and clears emoji without dropping initials", () => {
    const withEmoji = applyBrandPatchToDesign({}, { initials: "IW", emoji: "🦊" });
    expect(withEmoji.brand).toEqual({ initials: "IW", emoji: "🦊" });
    const cleared = applyBrandPatchToDesign(withEmoji, { emoji: "" });
    expect(cleared.brand?.emoji).toBeUndefined();
    expect(cleared.brand?.initials).toBe("IW");
  });
});

describe("parseBrandPatch", () => {
  it("requires at least one field", () => {
    expect(parseBrandPatch({})).toEqual({
      ok: false,
      error: "provide name, initials, logo, and/or emoji",
    });
  });

  it("accepts emoji", () => {
    expect(parseBrandPatch({ emoji: "🚀" })).toEqual({
      ok: true,
      patch: { emoji: "🚀" },
    });
  });
});

describe("resolveShellPet / applyPetPatchToDesign", () => {
  it("defaults to enabled airring with catalog name", () => {
    expect(resolveShellPet(null)).toEqual({
      enabled: true,
      id: "airring",
      name: "AirRing",
      size: 28,
    });
  });

  it("lists shipped Codex pets for the picker", () => {
    expect(STUDIO_PET_OPTIONS.map((p) => p.id)).toEqual([...STUDIO_PET_IDS]);
    expect(STUDIO_PET_OPTIONS.every((p) => p.label && p.blurb)).toBe(true);
  });

  it("patches pet id", () => {
    const next = applyPetPatchToDesign({}, { id: "battle-beast", size: 32 });
    expect(resolveShellPet(next)).toEqual({
      enabled: true,
      id: "battle-beast",
      name: "Battle Beast",
      size: 32,
    });
  });

  it("uses custom nickname when set", () => {
    const next = applyPetPatchToDesign(
      { pet: { id: "airring" } },
      { name: "  Pip  " },
    );
    expect(next.pet).toEqual({ id: "airring", name: "Pip" });
    expect(resolveShellPet(next).name).toBe("Pip");
  });

  it("clears custom nickname with null", () => {
    const next = applyPetPatchToDesign(
      { pet: { id: "boba", name: "Bean" } },
      { name: null },
    );
    expect(next.pet).toEqual({ id: "boba" });
    expect(resolveShellPet(next).name).toBe("Boba");
  });

  it("maps legacy bichito ids to airring", () => {
    expect(resolveShellPet({ pet: { id: "cain" } }).id).toBe("airring");
  });
});

describe("resolveEffectiveShellPet", () => {
  it("inherits studio when project has no pet", () => {
    expect(
      resolveEffectiveShellPet({
        studio: { id: "battle-beast", name: "Beast" },
        project: null,
      }),
    ).toEqual({
      enabled: true,
      id: "battle-beast",
      name: "Beast",
      size: 28,
    });
    expect(projectPetOverridesStudio(null)).toBe(false);
  });

  it("partial override: name only keeps studio id", () => {
    expect(
      resolveEffectiveShellPet({
        studio: { id: "battle-beast" },
        project: { name: "Pip" },
      }),
    ).toEqual({
      enabled: true,
      id: "battle-beast",
      name: "Pip",
      size: 28,
    });
    expect(projectPetOverridesStudio({ name: "Pip" })).toBe(true);
  });

  it("full project override wins", () => {
    expect(
      resolveEffectiveShellPet({
        studio: { id: "battle-beast", enabled: true },
        project: { id: "airring", enabled: false },
      }),
    ).toEqual({
      enabled: false,
      id: "airring",
      name: "AirRing",
      size: 28,
    });
  });

  it("forceGlobal ignores project override", () => {
    expect(
      resolveEffectiveShellPet({
        studio: { id: "battle-beast", name: "Beast" },
        project: { id: "airring", name: "Pip" },
        forceGlobal: true,
      }),
    ).toEqual({
      enabled: true,
      id: "battle-beast",
      name: "Beast",
      size: 28,
    });
  });

  it("empty layers fall back to code default", () => {
    expect(resolveEffectiveShellPet({})).toEqual({
      enabled: true,
      id: "airring",
      name: "AirRing",
      size: 28,
    });
  });
});

describe("parsePetPatch", () => {
  it("rejects invalid pet id", () => {
    expect(parsePetPatch({ id: "Not Valid!" }).ok).toBe(false);
  });

  it("accepts gallery Codex slug", () => {
    expect(parsePetPatch({ id: "boba" })).toEqual({
      ok: true,
      patch: { id: "boba" },
    });
  });

  it("accepts battle-beast", () => {
    expect(parsePetPatch({ id: "battle-beast" })).toEqual({
      ok: true,
      patch: { id: "battle-beast" },
    });
  });

  it("accepts name and rejects overlong", () => {
    expect(parsePetPatch({ name: "Pip" })).toEqual({
      ok: true,
      patch: { name: "Pip" },
    });
    expect(parsePetPatch({ name: "x".repeat(33) }).ok).toBe(false);
  });
});

describe("shellColorOverridesToCssVars", () => {
  it("flattens nested color groups", () => {
    expect(
      shellColorOverridesToCssVars({
        fg: { accent: "#0f766e", onAccent: "#fff" },
        bg: { sidebar: "#f0fdfa" },
      }),
    ).toEqual({
      "--as-color-fg-accent": "#0f766e",
      "--as-color-fg-onAccent": "#fff",
      "--as-color-bg-sidebar": "#f0fdfa",
    });
  });
});

describe("coerceProjectShellForTheme", () => {
  it("keeps full design.shell maps", () => {
    const shell = {
      color: { bg: { canvas: "#2f39ba" }, fg: { accent: "#2f39ba" } },
    };
    expect(coerceProjectShellForTheme(shell)).toEqual(shell);
  });

  it("maps list summary accents to fg (does not drop to empty)", () => {
    expect(
      coerceProjectShellForTheme({
        initials: "BH",
        displayName: "beehiiv.com",
        accent: "#2f39ba",
        accentDark: "#5b65d6",
      }),
    ).toEqual({
      color: { fg: { accent: "#2f39ba" } },
      colorDark: { fg: { accent: "#5b65d6" } },
    });
  });

  it("returns null for empty summary", () => {
    expect(coerceProjectShellForTheme({ initials: "BH" })).toBeNull();
  });
});

describe("shellOverrideStyleBlock", () => {
  it("emits light + dark blocks", () => {
    const css = shellOverrideStyleBlock({
      color: { fg: { accent: "#2563eb" } },
      colorDark: { fg: { accent: "#60a5fa" } },
    });
    expect(css).toContain(":root {");
    expect(css).toContain("--as-color-fg-accent: #2563eb;");
    expect(css).toContain(".dark {");
    expect(css).toContain("--as-color-fg-accent: #60a5fa;");
  });

  it("returns empty when no shell", () => {
    expect(shellOverrideStyleBlock(null)).toBe("");
    expect(shellOverrideStyleBlock(undefined)).toBe("");
  });
});

describe("applyShellColorPatchToDesign", () => {
  it("fillShell replaces prior purple project bg", () => {
    const next = applyShellColorPatchToDesign(
      {
        shell: {
          color: {
            fg: { accent: "#7c3aed" },
            bg: { sidebar: "#f5f3ff", muted: "#ede9fe" },
          },
          colorDark: {
            fg: { accent: "#a78bfa" },
            bg: { sidebar: "#1e1b4b", muted: "#312e81" },
          },
        },
      },
      { accent: "#fbbf24", accentDark: "#fcd34d", fillShell: true },
    );
    expect(next.shell?.color?.bg?.sidebar).not.toBe("#f5f3ff");
    expect(next.shell?.color?.bg?.canvas).not.toBe(next.shell?.color?.bg?.surface);
    expect(next.shell?.colorDark?.bg?.sidebar).not.toBe("#1e1b4b");
    expect(next.shell?.color?.fg?.accent).toBe("#fbbf24");
  });
});

describe("summarizeProjectShell", () => {
  it("exposes accent + color maps for optimistic workspace paint", () => {
    expect(
      summarizeProjectShell({
        design: {
          brand: { initials: "DB" },
          shell: {
            color: {
              fg: { accent: "#2563eb" },
              bg: { canvas: "#eff6ff" },
            },
            colorDark: { fg: { accent: "#60a5fa" } },
          },
        },
        projectId: "demo-blog",
      }),
    ).toEqual({
      initials: "DB",
      displayName: "demo-blog",
      accent: "#2563eb",
      accentDark: "#60a5fa",
      color: {
        fg: { accent: "#2563eb" },
        bg: { canvas: "#eff6ff" },
      },
      colorDark: { fg: { accent: "#60a5fa" } },
    });
  });
});
