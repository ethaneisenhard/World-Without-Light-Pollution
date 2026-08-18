import { describe, expect, it } from "vitest";
import { STUDIO_SERVICE_DEFS } from "./studio-service-registry-pure.js";
import {
  DEFAULT_REMOTE_STUDIO_URL,
  previewMenuLabel,
  projectPreviewLinks,
} from "./preview-links-pure.js";

const N8N = STUDIO_SERVICE_DEFS.n8n.defaultUrl;
const VOICE = STUDIO_SERVICE_DEFS.voice.defaultUrl;
const LITELLM = STUDIO_SERVICE_DEFS.litellm.defaultUrl;

describe("projectPreviewLinks", () => {
  it("omits empty hrefs and keeps stable order", () => {
    expect(
      projectPreviewLinks({
        studioOrigin: "http://127.0.0.1:4400",
        siteUrl: "http://127.0.0.1:8789",
        serviceUrls: {
          n8n: N8N,
          voice: VOICE,
          litellm: LITELLM,
        },
        apiUrl: "http://127.0.0.1:3847",
        remoteStudioUrl: "https://studio.tail0a3a18.ts.net/",
      }).map((l) => l.id),
    ).toEqual(["studio", "phone", "site", "n8n", "voice", "litellm", "api"]);

    expect(
      projectPreviewLinks({
        studioOrigin: "http://127.0.0.1:4400",
        siteUrl: "  ",
      }),
    ).toEqual([
      {
        id: "studio",
        label: "Studio",
        href: "http://127.0.0.1:4400",
        external: false,
      },
      {
        id: "phone",
        label: "Tailnet",
        href: DEFAULT_REMOTE_STUDIO_URL,
        external: true,
      },
    ]);
  });

  it("always includes hard-coded Tailnet when remote URL missing", () => {
    const links = projectPreviewLinks({
      studioOrigin: "http://127.0.0.1:4400",
    });
    expect(links.find((l) => l.id === "phone")).toEqual({
      id: "phone",
      label: "Tailnet",
      href: DEFAULT_REMOTE_STUDIO_URL,
      external: true,
    });
  });

  it("labels menu from site host when present", () => {
    const links = projectPreviewLinks({
      studioOrigin: "http://127.0.0.1:4400",
      siteUrl: "http://127.0.0.1:8789/",
    });
    expect(previewMenuLabel(links)).toBe("127.0.0.1:8789");
  });

  it("falls back to Preview when no site (not n8n/Studio)", () => {
    const links = projectPreviewLinks({
      studioOrigin: "http://127.0.0.1:4400",
      serviceUrls: { n8n: N8N },
    });
    expect(previewMenuLabel(links)).toBe("Preview");
  });
});
