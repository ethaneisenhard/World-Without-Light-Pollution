import { describe, expect, it } from "vitest";
import { createMemoryAnalyticsStore } from "./sql-analytics-store.js";

describe("memory AnalyticsStore", () => {
  it("tracks and lists", async () => {
    const store = createMemoryAnalyticsStore();
    await store.track({ name: "page_view", props: { path: "/" } });
    const list = await store.list();
    expect(list[0]?.name).toBe("page_view");
  });
});
