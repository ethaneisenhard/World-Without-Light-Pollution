import { describe, expect, it } from "vitest";
import {
  isR2MediaKind,
  parseMediaDestination,
  storageMediaDestinationId,
  unwrapSecretRef,
} from "./media-destination-pure.js";

describe("media-destination-pure", () => {
  it("unwraps secret refs", () => {
    expect(unwrapSecretRef("secret:R2_ACCOUNT_ID")).toEqual({
      kind: "secret",
      name: "R2_ACCOUNT_ID",
    });
    expect(unwrapSecretRef("plain")).toEqual({ kind: "literal", name: "plain" });
  });

  it("parses local destination", () => {
    expect(
      parseMediaDestination({ id: "project-media", kind: "media-local", path: "media" }),
    ).toEqual({ kind: "local", path: "media" });
  });

  it("parses r2 destination with secret refs", () => {
    const dest = parseMediaDestination(
      {
        id: "cdn-r2",
        kind: "r2",
        bucket: "my-bucket",
        publicBaseUrl: "https://cdn.example",
        credentials: {
          accountId: "secret:R2_ACCOUNT_ID",
          accessKeyId: "secret:R2_ACCESS_KEY_ID",
          secretAccessKey: "secret:R2_SECRET_ACCESS_KEY",
        },
      },
      { defaultPrefix: "glassbox-studio-template" },
    );
    expect(dest?.kind).toBe("r2");
    if (dest?.kind === "r2") {
      expect(dest.bucket).toBe("my-bucket");
      expect(dest.prefix).toBe("glassbox-studio-template");
      expect(dest.credentials.accountId).toBe("secret:R2_ACCOUNT_ID");
    }
  });

  it("reads storage.media id", () => {
    expect(storageMediaDestinationId({ storage: { media: "cdn-r2" } })).toBe(
      "cdn-r2",
    );
    expect(isR2MediaKind("media-r2")).toBe(true);
  });
});
