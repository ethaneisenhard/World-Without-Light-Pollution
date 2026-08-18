import { describe, expect, it } from "vitest";
import {
  defaultSecretPathForKey,
  isValidSecretKey,
  mergeDotenvKey,
  parseSecretsSetInput,
  redactSecretValue,
  workerBindingForSecretKey,
} from "./secrets-infisical-pure.js";

describe("secrets-infisical-pure", () => {
  it("validates UPPER_SNAKE keys", () => {
    expect(isValidSecretKey("ANTHROPIC_API_KEY")).toBe(true);
    expect(isValidSecretKey("foo")).toBe(false);
    expect(isValidSecretKey("A")).toBe(true);
  });

  it("defaults path from key prefix", () => {
    expect(defaultSecretPathForKey("CLOUDFLARE_API_TOKEN")).toBe("/cloudflare");
    expect(defaultSecretPathForKey("N8N_API_KEY")).toBe("/n8n");
    expect(defaultSecretPathForKey("FOO_BAR")).toBe("/studio");
    expect(defaultSecretPathForKey("STUDIO_PREVIEW_BASE")).toBe("/host");
  });

  it("maps Worker bindings", () => {
    expect(workerBindingForSecretKey("ANTHROPIC_API_KEY")).toBe(
      "ANTHROPIC_API_KEY",
    );
    expect(workerBindingForSecretKey("GOOGLE_OAUTH_CLIENT_ID")).toBe(
      "GOOGLE_CLIENT_ID",
    );
    expect(workerBindingForSecretKey("FOO_API_KEY")).toBeNull();
  });

  it("redacts values", () => {
    expect(redactSecretValue("abcd")).toBe("****");
    expect(redactSecretValue("supersecretvalue")).toMatch(/…/);
  });

  it("merges dotenv keys without duplicating", () => {
    const a = mergeDotenvKey("FOO=1\nBAR=2\n", "FOO", "9");
    expect(a).toContain("FOO=9");
    expect(a).toContain("BAR=2");
    const b = mergeDotenvKey("FOO=1\n", "NEW", "x");
    expect(b).toContain("NEW=x");
  });

  it("parses secrets.set input", () => {
    const ok = parseSecretsSetInput({
      key: "FOO_API_KEY",
      value: "secret",
    });
    expect(ok).toMatchObject({
      key: "FOO_API_KEY",
      value: "secret",
      path: "/studio",
      env: "dev",
    });
    const bad = parseSecretsSetInput({ key: "bad", value: "x" });
    expect(bad).toHaveProperty("error");
  });
});
