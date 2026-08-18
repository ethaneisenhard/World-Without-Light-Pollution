import { describe, expect, it, afterEach } from "vitest";
import {
  createStandaloneInspectorShell,
  nextInspectorDockMode,
  parseInspectorDockMode,
} from "./standalone-shell.js";

describe("inspector dock mode", () => {
  it("parses and toggles", () => {
    expect(parseInspectorDockMode("window")).toBe("window");
    expect(parseInspectorDockMode("nope")).toBe("sidebar");
    expect(nextInspectorDockMode("sidebar")).toBe("window");
    expect(nextInspectorDockMode("window")).toBe("sidebar");
  });
});

describe("createStandaloneInspectorShell embedded", () => {
  let shell: ReturnType<typeof createStandaloneInspectorShell> | null = null;

  afterEach(() => {
    shell?.destroy();
    shell = null;
    document.getElementById("as-ci-shell-style")?.remove();
  });

  it("mounts into host without FAB and fills embedded variant", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    shell = createStandaloneInspectorShell({
      doc: document,
      win: window,
      mount: host,
      variant: "embedded",
    });

    expect(host.contains(shell.root)).toBe(true);
    expect(shell.root.getAttribute("data-as-ci-variant")).toBe("embedded");
    const fab = shell.root.querySelector("[data-as-ci-fab]");
    expect(fab).toBeTruthy();
    expect((fab as HTMLElement).hidden).toBe(true);

    shell.open();
    expect(shell.isOpen()).toBe(true);
    const aside = shell.root.querySelector("[data-as-ci-shell]");
    expect((aside as HTMLElement).hidden).toBe(false);

    host.remove();
  });

  it("does not pad document html when embedded", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    shell = createStandaloneInspectorShell({
      doc: document,
      win: window,
      mount: host,
      variant: "embedded",
    });
    shell.open();

    expect(
      document.documentElement.getAttribute("data-as-ci-sidebar-open"),
    ).toBeNull();

    host.remove();
  });

  it("Close hides shell despite display:flex stylesheet", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let openChange: boolean | null = null;

    shell = createStandaloneInspectorShell({
      doc: document,
      win: window,
      mount: host,
      variant: "embedded",
      onOpenChange: (open) => {
        openChange = open;
      },
    });
    shell.open();
    const aside = shell.root.querySelector<HTMLElement>("[data-as-ci-shell]")!;
    const closeBtn = shell.root.querySelector<HTMLButtonElement>(
      "[data-as-ci-close]",
    )!;
    expect(aside.hidden).toBe(false);

    closeBtn.click();

    expect(shell.isOpen()).toBe(false);
    expect(aside.hidden).toBe(true);
    expect(aside.style.getPropertyPriority("display")).toBe("important");
    expect(aside.style.display).toBe("none");
    expect(openChange).toBe(false);
    // Stylesheet must include [hidden]{display:none!important} so Close wins
    const style = document.getElementById("as-ci-shell-style");
    expect(style?.textContent).toMatch(
      /\[data-as-ci-shell\]\[hidden\][\s\S]*display:\s*none\s*!important/,
    );

    host.remove();
  });

  it("silent close does not re-notify host", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let closes = 0;
    shell = createStandaloneInspectorShell({
      doc: document,
      win: window,
      mount: host,
      variant: "embedded",
      onOpenChange: (open) => {
        if (!open) closes += 1;
      },
    });
    shell.open();
    shell.close({ notify: false });
    expect(closes).toBe(0);
    expect(shell.isOpen()).toBe(false);
    host.remove();
  });

  it("injects mobile peek-sheet CSS for standalone sidebar", () => {
    shell = createStandaloneInspectorShell({
      doc: document,
      win: window,
      variant: "standalone",
    });
    const css = document.getElementById("as-ci-shell-style")?.textContent ?? "";
    expect(css).toContain("max-width: 719px");
    expect(css).toContain("42vh");
    expect(css).toContain("padding-right: 0 !important");
  });
});
