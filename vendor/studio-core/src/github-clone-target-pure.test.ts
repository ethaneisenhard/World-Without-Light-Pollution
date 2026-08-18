import { describe, expect, it } from "vitest";
import {
  classifyGithubCloneHint,
  extractCloneSearchToken,
  isGithubCloneUtterance,
  isSingleAgentGithubJob,
  pickGithubRepoFromSearchResults,
} from "./github-clone-target-pure.js";

describe("isGithubCloneUtterance", () => {
  it("matches clone / download github jobs", () => {
    expect(isGithubCloneUtterance("download the GitHub")).toBe(true);
    expect(
      isGithubCloneUtterance(
        "Clone the GitHub repo www.beehive.com into the workspace",
      ),
    ).toBe(true);
    expect(isGithubCloneUtterance("open messages")).toBe(false);
  });
});

describe("isSingleAgentGithubJob", () => {
  it("covers spoken shorts the clone regex misses", () => {
    expect(isSingleAgentGithubJob("Please clone.")).toBe(true);
    expect(isSingleAgentGithubJob("clone the bee vibe")).toBe(true);
    expect(isSingleAgentGithubJob("listy all my github repos")).toBe(true);
    expect(isSingleAgentGithubJob("All the repos in GitHub.")).toBe(true);
    expect(isSingleAgentGithubJob("open messages")).toBe(false);
  });
});

describe("classifyGithubCloneHint", () => {
  it("extracts an explicit GitHub URL", () => {
    const h = classifyGithubCloneHint(
      "clone https://github.com/beehiiv/beehiiv into a workspace",
    );
    expect(h.kind).toBe("url");
    if (h.kind !== "url") return;
    expect(h.owner).toBe("beehiiv");
    expect(h.repo).toBe("beehiiv");
  });

  it("maps beehive.com typo to a beehiiv search", () => {
    const h = classifyGithubCloneHint(
      "Clone the GitHub repo www.beehive.com into the workspace",
    );
    expect(h).toEqual({
      kind: "search",
      query: "beehiiv github",
      token: "beehiiv",
    });
  });

  it("asks when there is no repo or site", () => {
    expect(classifyGithubCloneHint("download the GitHub")).toEqual({
      kind: "ask",
    });
  });
});

describe("extractCloneSearchToken", () => {
  it("strips www and aliases beehive", () => {
    expect(extractCloneSearchToken("www.beehive.com")).toBe("beehiiv");
  });
});

describe("pickGithubRepoFromSearchResults", () => {
  it("prefers the org that matches the search token", () => {
    const picked = pickGithubRepoFromSearchResults(
      [
        { url: "https://github.com/topics/newsletters", title: "Topics" },
        { url: "https://github.com/other/beehive", title: "other" },
        { url: "https://github.com/beehiiv/beehiiv", title: "beehiiv" },
      ],
      "beehiiv",
    );
    expect(picked?.owner).toBe("beehiiv");
    expect(picked?.repo).toBe("beehiiv");
  });
});
