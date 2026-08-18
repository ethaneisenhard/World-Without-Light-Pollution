import { afterEach, describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { installCanvasInspectorGuest } from "./guest-boot.js";
import { CANVAS_INSPECTOR_PROTOCOL } from "./attr-contract-pure.js";

describe("installCanvasInspectorGuest top-level Close", () => {
  let win: Window | null = null;

  afterEach(() => {
    win?.happyDOM.close();
    win = null;
  });

  it("Close stays closed when deactivate posts null select to self", () => {
    win = new Window({ url: "http://127.0.0.1:9889/" });
    const doc = win.document;
    doc.body.innerHTML = `
      <section data-as-inspect="1" data-as-kind="component" data-as-component="section">
        Hi
      </section>
    `;

    installCanvasInspectorGuest(win as unknown as globalThis.Window);

    const fab = doc.querySelector<HTMLButtonElement>("[data-as-ci-fab]");
    expect(fab).toBeTruthy();
    fab!.click();

    const shell = doc.querySelector<HTMLElement>("[data-as-ci-shell]");
    expect(shell?.hidden).toBe(false);

    const close = doc.querySelector<HTMLButtonElement>("[data-as-ci-close]");
    expect(close).toBeTruthy();
    close!.click();

    // Sync close applied.
    expect(shell?.hidden).toBe(true);

    // Simulate the deactivate → setSelected(null) → postMessage(select null) loop
    // that previously reopened chrome on top-level (parent === self).
    win.dispatchEvent(
      new win.MessageEvent("message", {
        data: {
          protocol: CANVAS_INSPECTOR_PROTOCOL,
          type: "select",
          target: null,
        },
      }),
    );

    expect(shell?.hidden).toBe(true);
  });
});
