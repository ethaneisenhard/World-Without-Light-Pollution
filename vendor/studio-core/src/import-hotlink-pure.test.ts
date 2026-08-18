import { describe, expect, it } from "vitest";
import {
  listRelativeImportHotlinks,
  normalizeProjectRelativePath,
  preferredImportHotlinkPath,
  resolveRelativeImportPath,
} from "./import-hotlink-pure.js";

describe("normalizeProjectRelativePath", () => {
  it("collapses .. segments", () => {
    expect(normalizeProjectRelativePath("client/design/../inspect-attrs.ts")).toBe(
      "client/inspect-attrs.ts",
    );
  });

  it("rejects escape above root", () => {
    expect(normalizeProjectRelativePath("../outside")).toBeNull();
  });
});

describe("resolveRelativeImportPath", () => {
  it("resolves sibling and parent imports", () => {
    expect(
      resolveRelativeImportPath(
        "client/design/entry.tsx",
        "./sandbox-root.tsx",
      ),
    ).toBe("client/design/sandbox-root.tsx");
    expect(
      resolveRelativeImportPath(
        "client/design/entry.tsx",
        "../inspect-attrs.ts",
      ),
    ).toBe("client/inspect-attrs.ts");
  });

  it("ignores package imports", () => {
    expect(
      resolveRelativeImportPath("client/design/entry.tsx", "remix/ui"),
    ).toBeNull();
  });
});

describe("importHotlinkAtOffset", () => {
  it("hits specifier and surrounding quotes", async () => {
    const { importHotlinkAtOffset } = await import("./import-hotlink-pure.js");
    const source = `import x from "../inspect-attrs.ts";\n`;
    const start = source.indexOf("../inspect-attrs.ts");
    expect(
      importHotlinkAtOffset("client/design/entry.tsx", source, start)?.specifier,
    ).toBe("../inspect-attrs.ts");
    expect(
      importHotlinkAtOffset(
        "client/design/entry.tsx",
        source,
        start - 1,
      )?.specifier,
    ).toBe("../inspect-attrs.ts");
  });
});

describe("listRelativeImportHotlinks", () => {
  it("finds from / import / require relative specs", () => {
    const source = `
/** @jsxImportSource remix/ui */
import { type Handle } from "remix/ui";
import {
  inspectComponentAttrs,
  inspectSlotAttrs,
} from "../inspect-attrs.ts";
import "./sandbox-root.tsx";
const x = require("./legacy.js");
void import("./lazy.ts");
export { z } from "../z.ts";
`;
    const links = listRelativeImportHotlinks(
      "client/design/entry.tsx",
      source,
    );
    const specs = links.map((l) => l.specifier);
    expect(specs).toContain("../inspect-attrs.ts");
    expect(specs).toContain("./sandbox-root.tsx");
    expect(specs).toContain("./legacy.js");
    expect(specs).toContain("./lazy.ts");
    expect(specs).toContain("../z.ts");
    expect(specs).not.toContain("remix/ui");
    expect(
      preferredImportHotlinkPath(
        links.find((l) => l.specifier === "../inspect-attrs.ts")!,
      ),
    ).toBe("client/inspect-attrs.ts");
  });

  it("adds extension candidates when specifier has none", () => {
    const links = listRelativeImportHotlinks(
      "src/a.ts",
      `import { b } from "./b";`,
    );
    expect(links[0]!.candidates[0]).toBe("src/b.ts");
    expect(links[0]!.candidates).toContain("src/b.tsx");
  });
});
