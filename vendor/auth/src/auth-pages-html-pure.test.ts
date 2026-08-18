import { describe, expect, it } from "vitest";
import {
  renderAuthAccountHtml,
  renderAuthLoginHtml,
  renderAuthMembersHtml,
  renderAuthSignupHtml,
} from "./auth-pages-html-pure.js";
import { AUTH_CLASSES_STARTER, AUTH_CLASSES_STUDIO } from "./auth-pages-classes.js";

const user = {
  id: "u1",
  email: "member@example.com",
  name: "Starter Member",
  role: "MEMBER" as const,
};

describe("auth pages html", () => {
  it("starter login uses paper/ink card chrome", () => {
    const html = renderAuthLoginHtml({ skin: "starter", error: "auth" });
    expect(html).toContain('href="/styles.css"');
    expect(html).toContain(AUTH_CLASSES_STARTER.card.split(" ")[0]);
    expect(html).toContain("bg-paper");
    expect(html).toContain("border-line");
    // Soft gate redirect — no redundant alert banner
    expect(html).not.toContain('role="alert">Sign in to continue');
    expect(html).toContain("Welcome back! Please sign in to continue");
  });

  it("auth pages accept theme boot + toggle", () => {
    const html = renderAuthLoginHtml({
      skin: "starter",
      colorMode: "dark",
      themeBootScript: "/*boot*/",
      themeToggleHtml: '<button type="button" data-as-theme-toggle>T</button>',
    });
    expect(html).toContain('class="dark"');
    expect(html).toContain('data-theme="dark"');
    expect(html).toContain("/*boot*/");
    expect(html).toContain("data-as-theme-toggle");
  });

  it("studio login uses surface/brand chrome", () => {
    const html = renderAuthLoginHtml({ skin: "studio", showGoogle: true });
    expect(html).toContain("bg-canvas");
    expect(html).toContain("bg-surface");
    expect(html).toContain("bg-brand-600");
    expect(html).toContain("Google");
    expect(html).toContain('href="/login/google?returnTo=');
    expect(html).toContain("Welcome back");
    expect(html).toContain("Don't have an account?");
    expect(html).toContain("Sign in");
    expect(html).not.toContain("Secured by");
    expect(html).toContain(AUTH_CLASSES_STUDIO.btnPrimary.slice(0, 20));
    expect(html).toContain('data-as-glass-box-auth-mark="1"');
    expect(html).toContain("/glass-box-splash/mount.js");
    expect(html).toContain("/auth-glass-box-mark.js");
    expect(html).toContain('data-as-component="logo"');
    expect(html).not.toContain('src="/icons/glassbox-mark.svg"');
    // Gate face: World-Map bg, no card box-shadow, scrollable body.
    expect(html).toContain("bg-[url('/assets/svgs/World-Map.svg')]");
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("my-auto");
    expect(html).not.toContain("shadow-[0_24px_64px");
    expect(html).not.toContain("radial-gradient(circle_at_1px_1px");
  });

  it("studio login/signup default system + one sun/moon toggle like shell", () => {
    const login = renderAuthLoginHtml({ skin: "studio" });
    expect(login).toContain('data-color-mode="system"');
    expect(login).toContain('src="/color-mode-boot.js"');
    expect(login).toContain("data-as-auth-color-mode-toggle");
    expect(login).toContain("glassbox-studio:color-mode");
    expect(login).toContain("<svg");
    expect(login).toContain('href="/signup');

    const signup = renderAuthSignupHtml({ skin: "studio" });
    expect(signup).toContain('data-color-mode="system"');
    expect(signup).toContain("data-as-auth-color-mode-toggle");
  });

  it("starter login shows forgot link when enabled", () => {
    const html = renderAuthLoginHtml({
      skin: "starter",
      showForgotPassword: true,
    });
    expect(html).toContain("Forgot password?");
    expect(html).toContain('href="/forgot-password"');
  });

  it("studio login wires Kent passkey autofill + script under Google", () => {
    const html = renderAuthLoginHtml({
      skin: "studio",
      showGoogle: true,
      passkeyScriptHref: "/auth-passkey.js",
      returnTo: "/",
    });
    expect(html).toContain('autocomplete="username webauthn"');
    expect(html).toContain("data-as-passkey-login");
    expect(html).toContain(">Passkey</span>");
    expect(html).not.toContain("Use passkey instead");
    expect(html).toContain('src="/auth-passkey.js"');
    expect(html).toContain('data-as-return-to="/"');
    // Tight gate order: form → or → Google + Passkey row
    const formAt = html.indexOf("data-as-passkey-form");
    const orAt = html.indexOf('aria-label="or"');
    const googleAt = html.indexOf(">Google</span>");
    const passkeyAt = html.indexOf("data-as-passkey-login");
    expect(formAt).toBeGreaterThan(-1);
    expect(orAt).toBeGreaterThan(formAt);
    expect(googleAt).toBeGreaterThan(orAt);
    expect(passkeyAt).toBeGreaterThan(googleAt);
  });

  it("signup matches tight gate card", () => {
    const html = renderAuthSignupHtml({ skin: "studio", showGoogle: true });
    expect(html).toContain("Create account");
    expect(html).toContain("Already have an account?");
    expect(html).toContain("Sign in");
    expect(html).not.toContain("Secured by");
    expect(html).toContain("Google");
  });

  it("account + members keep proof attrs", () => {
    expect(renderAuthAccountHtml(user, { skin: "starter" })).toContain(
      'data-as-auth="signed-in"',
    );
    expect(renderAuthMembersHtml(user)).toContain("Members only");
    expect(renderAuthMembersHtml(user)).toContain("rounded-2xl");
  });

  it("account passkey manage section", () => {
    const html = renderAuthAccountHtml(user, {
      skin: "studio",
      passkeyScriptHref: "/auth-passkey.js",
      passkeys: [{ id: "cred-abcdefghijklmnopqrstuvwxyz", label: "platform · synced" }],
    });
    expect(html).toContain("data-as-passkey-manage");
    expect(html).toContain("data-as-passkey-register");
    expect(html).toContain("Add passkey");
    expect(html).toContain("cred-abcdefghijk");
  });
});
