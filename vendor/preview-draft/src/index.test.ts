import { describe, expect, it } from "vitest";
import {
  contentPathForSlug,
  createPreviewDraftStore,
  handlePreviewDraftRequestOrchestrator,
  normalizeDraftPath,
  PREVIEW_DRAFT_HTTP_PATH,
  slugFromContentPath,
} from "./index.js";

describe("preview-draft", () => {
  it("normalizes paths", () => {
    expect(normalizeDraftPath("\\content\\blog\\a.mdx")).toBe("content/blog/a.mdx");
    expect(normalizeDraftPath("/content/a.md")).toBe("content/a.md");
  });

  it("slug ↔ path", () => {
    expect(slugFromContentPath("content/blog/hello.mdx", "content/blog", ".mdx")).toBe(
      "hello",
    );
    expect(slugFromContentPath("content/pages/home.md", "content/pages", "md")).toBe(
      "home",
    );
    expect(slugFromContentPath("src/x.ts", "content/blog", ".mdx")).toBeNull();
    expect(contentPathForSlug("content/blog", "hello", ".mdx")).toBe(
      "content/blog/hello.mdx",
    );
  });

  it("store set/get/clear", () => {
    const store = createPreviewDraftStore();
    store.set("content/blog/a.mdx", "hi");
    expect(store.get("/content/blog/a.mdx")).toBe("hi");
    store.clear("content/blog/a.mdx");
    expect(store.has("content/blog/a.mdx")).toBe(false);
  });

  it("HTTP orchestrator PUT then GET", async () => {
    const store = createPreviewDraftStore();
    const put = await handlePreviewDraftRequestOrchestrator(
      { store },
      new Request(`http://x${PREVIEW_DRAFT_HTTP_PATH}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "content/blog/a.mdx", content: "draft" }),
      }),
    );
    expect(put?.status).toBe(200);
    expect(store.get("content/blog/a.mdx")).toBe("draft");

    const get = await handlePreviewDraftRequestOrchestrator(
      { store },
      new Request(`http://x${PREVIEW_DRAFT_HTTP_PATH}?path=content/blog/a.mdx`),
    );
    const json = (await get!.json()) as { content: string };
    expect(json.content).toBe("draft");

    const del = await handlePreviewDraftRequestOrchestrator(
      { store },
      new Request(`http://x${PREVIEW_DRAFT_HTTP_PATH}?path=content/blog/a.mdx`, {
        method: "DELETE",
      }),
    );
    expect(del?.status).toBe(200);
    expect(store.has("content/blog/a.mdx")).toBe(false);
  });

  it("returns null for other paths", async () => {
    const store = createPreviewDraftStore();
    const res = await handlePreviewDraftRequestOrchestrator(
      { store },
      new Request("http://x/blog"),
    );
    expect(res).toBeNull();
  });

  it("PUT with X-AS-HMR returns rendered HTML when renderHtml provided", async () => {
    const store = createPreviewDraftStore();
    const put = await handlePreviewDraftRequestOrchestrator(
      {
        store,
        renderHtml: async () =>
          "<html><body><main data-as-preview-root>hi</main></body></html>",
      },
      new Request(`http://x${PREVIEW_DRAFT_HTTP_PATH}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-AS-HMR": "1",
          "X-AS-HMR-URL": "http://x/",
        },
        body: JSON.stringify({ path: "content/pages/home.md", content: "# x" }),
      }),
    );
    expect(put?.headers.get("content-type")).toContain("text/html");
    expect(await put!.text()).toContain("data-as-preview-root");
    expect(store.get("content/pages/home.md")).toBe("# x");
  });
});
