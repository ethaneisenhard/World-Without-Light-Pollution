import { describe, expect, it } from "vitest";
import {
  classifyRuntimeStartError,
  decideRuntimeStartPreflight,
  runtimeStartErrorPlainHeader,
} from "./runtime-start-heal-pure.ts";

describe("decideRuntimeStartPreflight", () => {
  it("fails when package.json missing", () => {
    const d = decideRuntimeStartPreflight({
      hasPackageJson: false,
      hasNodeModules: false,
      command: "pnpm",
    });
    expect(d.action).toBe("fail_missing_manifest");
    expect(d.reason).not.toMatch(/\bHost\b/);
  });

  it("installs when package.json present but no node_modules", () => {
    expect(
      decideRuntimeStartPreflight({
        hasPackageJson: true,
        hasNodeModules: false,
        command: "pnpm",
      }).action,
    ).toBe("install_deps");
  });

  it("skips manifest gate for bare node commands", () => {
    expect(
      decideRuntimeStartPreflight({
        hasPackageJson: false,
        hasNodeModules: false,
        command: "node",
      }).action,
    ).toBe("ok");
  });
});

describe("classifyRuntimeStartError", () => {
  it("detects ERR_PNPM_NO_IMPORTER_MANIFEST", () => {
    expect(
      classifyRuntimeStartError({
        log: ["ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND No package.json"],
      }),
    ).toBe("missing_manifest");
  });

  it("port_in_use still wins", () => {
    expect(
      classifyRuntimeStartError({
        lastError: "EADDRINUSE",
      }),
    ).toBe("port_in_use");
  });
});

describe("runtimeStartErrorPlainHeader", () => {
  it("plain missing_manifest copy", () => {
    const h = runtimeStartErrorPlainHeader("missing_manifest");
    expect(h).toMatch(/package\.json/i);
    expect(h).not.toMatch(/\bHost\b/);
  });
});
