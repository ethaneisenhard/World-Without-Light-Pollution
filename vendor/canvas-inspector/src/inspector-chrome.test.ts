import { afterEach, describe, expect, it, vi } from "vitest";
import { createInspectorChrome } from "./inspector-chrome.js";

describe("createInspectorChrome", () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.getElementById("as-ci-shell-style")?.remove();
  });

  it("mounts Outlines toolbar and paints meta fields", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let reveal = true;
    let labels = false;
    let mode: "select" | "browse" = "select";
    const applied: unknown[] = [];

    const chrome = createInspectorChrome({
      doc: document,
      win: window,
      mount: host,
      variant: "embedded",
      fetchMeta: async () => ({
        id: "blog-hero",
        title: "Blog hero",
        props: {
          layout: {
            type: "enum" as const,
            values: ["stack", "side"],
            default: "stack",
          },
        },
        slots: { title: { title: "Title" } },
        draft: {
          props: { layout: "stack" },
          slotText: { title: "Hi" },
          children: "",
        },
      }),
      applyDraft: (input) => applied.push(input),
      getRevealAll: () => reveal,
      setRevealAll: (on) => {
        reveal = on;
      },
      getLabelsOn: () => labels,
      setLabelsOn: (on) => {
        labels = on;
      },
      getInteractionMode: () => mode,
      setInteractionMode: (m) => {
        mode = m;
      },
      selectTarget: () => {},
    });

    chrome.open();
    expect(host.querySelector("[data-as-ci-toolbar]")?.textContent).toMatch(
      /Outlines · on/,
    );
    expect(host.querySelector("[data-as-ci-toolbar]")?.textContent).toMatch(
      /Select/,
    );
    expect(host.querySelector("[data-as-ci-toolbar]")?.textContent).toMatch(
      /Labels/,
    );

    chrome.setSelection({
      kind: "component",
      componentId: "blog-hero",
      instanceId: "x",
    });

    await vi.waitFor(() => {
      expect(host.querySelector("[data-as-ci-prop='layout']")).toBeTruthy();
      expect(host.querySelector("[data-as-ci-tabs]")).toBeTruthy();
    });

    const contentTab = host.querySelector<HTMLButtonElement>(
      "[data-as-ci-tab='content']",
    );
    expect(contentTab).toBeTruthy();
    contentTab!.click();

    await vi.waitFor(() => {
      expect(host.querySelector("[data-as-ci-slot='title']")).toBeTruthy();
    });

    chrome.destroy();
  });
});
