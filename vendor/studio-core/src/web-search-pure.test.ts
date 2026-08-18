import { describe, expect, it } from "vitest";
import {
  extractWebSearchResultsFromHtml,
  formatWebSearchResultsText,
  mapSearxngJsonToWebSearchResults,
  parseWebSearchInput,
  searxngSearchUrl,
  webSearchUrl,
} from "./web-search-pure.js";

describe("web-search-pure", () => {
  it("defaults engine to searxng", () => {
    expect(parseWebSearchInput({ query: "agent studio" })).toEqual({
      ok: true,
      value: { query: "agent studio", engine: "searxng", limit: 5 },
    });
  });

  it("accepts google + limit", () => {
    expect(
      parseWebSearchInput({ query: "remix", engine: "google", limit: 3 }),
    ).toEqual({
      ok: true,
      value: { query: "remix", engine: "google", limit: 3 },
    });
  });

  it("rejects bad engine", () => {
    expect(parseWebSearchInput({ query: "x", engine: "bing" })).toEqual({
      ok: false,
      error: 'engine must be "searxng", "brave", or "google"',
    });
  });

  it("builds engine urls", () => {
    expect(webSearchUrl("brave", "hello world")).toContain(
      "search.brave.com/search?q=hello%20world",
    );
    expect(webSearchUrl("google", "hello")).toContain(
      "google.com/search?q=hello",
    );
    const searx = searxngSearchUrl(
      "http://127.0.0.1:8888/",
      "hello world",
      5,
    );
    expect(searx.startsWith("http://127.0.0.1:8888/search?")).toBe(true);
    expect(searx).toContain("format=json");
    expect(searx).toMatch(/q=hello(\+|%20)world/);
  });

  it("maps SearXNG JSON results", () => {
    const results = mapSearxngJsonToWebSearchResults(
      {
        results: [
          {
            title: "Glass Box Studio",
            url: "https://example.com/as",
            content: "Shell for agents.",
          },
          {
            title: "Dup",
            url: "https://example.com/as",
            content: "skip",
          },
          {
            title: "Other",
            url: "https://other.test",
            content: "More",
          },
        ],
      },
      5,
    );
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      title: "Glass Box Studio",
      url: "https://example.com/as",
      snippet: "Shell for agents.",
    });
  });

  it("extracts Brave fixture cards", () => {
    const html = `
      <div data-type="web" class="snippet">
        <a href="https://example.com/a" class="result-header"><span class="title">Alpha Doc</span></a>
        <div class="snippet-description">First result about Alpha.</div>
      </div>
      <div data-type="web" class="snippet">
        <a href="https://example.com/b"><div class="title">Beta Guide</div></a>
        <p class="description">Second hit.</p>
      </div>
      <div data-type="web">
        <a href="https://search.brave.com/help">Skip me</a>
      </div>
    `;
    const results = extractWebSearchResultsFromHtml(html, "brave", 5);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      title: "Alpha Doc",
      url: "https://example.com/a",
    });
    expect(results[0]?.snippet).toContain("First result");
    expect(results[1]?.url).toBe("https://example.com/b");
  });

  it("extracts Google fixture .g blocks", () => {
    const html = `
      <div class="g">
        <a href="https://docs.example.com/remix"><h3>Remix docs</h3></a>
        <div class="VwiC3b">Official documentation for Remix.</div>
      </div>
      <div class="g Ww4FFb">
        <a href="/url?q=https://github.com/remix-run/remix&amp;sa=U"><h3>GitHub</h3></a>
        <span class="aCOpRe">Source on GitHub.</span>
      </div>
    `;
    const results = extractWebSearchResultsFromHtml(html, "google", 5);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]).toMatchObject({
      title: "Remix docs",
      url: "https://docs.example.com/remix",
    });
    expect(results.some((r) => r.url.includes("github.com"))).toBe(true);
  });

  it("formats text for chat", () => {
    const text = formatWebSearchResultsText({
      query: "test",
      engine: "searxng",
      results: [
        { title: "One", url: "https://one.test", snippet: "snip" },
      ],
    });
    expect(text).toContain("searxng");
    expect(text).toContain("https://one.test");
    expect(text).toContain("snip");
  });
});
