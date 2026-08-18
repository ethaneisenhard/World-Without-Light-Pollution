// @ts-nocheck — remix middleware / router types
import { route } from "remix/routes";
import { requireAuth } from "remix/middleware/auth";
import { redirect } from "remix/response/redirect";
import { AUTH_ROUTES } from "./auth-routes-pure.js";
import { renderAuthAccountHtml } from "./auth-pages-html-pure.js";
import type { PasskeyStore } from "./passkey-types.js";
import type { AuthUser } from "./types.js";

export const accountRoutes = route({
  account: AUTH_ROUTES.account,
  logout: AUTH_ROUTES.logout,
});

function identityUser(context: {
  auth?: { ok?: boolean; identity?: AuthUser };
}): AuthUser | null {
  if (context.auth?.ok && context.auth.identity) return context.auth.identity;
  return null;
}

function passkeyLabel(deviceType: string, backedUp: boolean): string {
  const kind = deviceType || "device";
  return backedUp ? `${kind} · synced` : kind;
}

export function createAccountRouteActions(opts?: {
  appTitle?: string;
  brandName?: string;
  passkeyStore?: PasskeyStore;
  passkeyScriptHref?: string;
}) {
  const requireUser = [
    requireAuth({
      onFailure: () =>
        redirect(
          `${AUTH_ROUTES.login}?error=auth&returnTo=${AUTH_ROUTES.account}`,
        ),
    }),
  ];

  return {
    account: {
      middleware: requireUser,
      async handler(context) {
        const user = identityUser(context);
        if (!user) return redirect(`${AUTH_ROUTES.login}?error=auth`);
        let passkeys: { id: string; label: string }[] | null = null;
        if (opts?.passkeyStore) {
          const rows = await opts.passkeyStore.listByUserId(user.id);
          passkeys = rows.map((p) => ({
            id: p.id,
            label: passkeyLabel(p.deviceType, p.backedUp),
          }));
        }
        const html = renderAuthAccountHtml(user, {
          skin: "studio",
          stylesheetHref: "/styles.css",
          brandName: opts?.brandName ?? "Glass Box Studio",
          appTitle: opts?.appTitle ?? "Account · Glass Box Studio",
          passkeyScriptHref: opts?.passkeyScriptHref ?? "/auth-passkey.js",
          passkeys,
        });
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
    logout: {
      middleware: [],
      async handler(context) {
        try {
          context.session?.unset?.("auth");
        } catch {
          /* ignore */
        }
        return redirect(AUTH_ROUTES.login);
      },
    },
  };
}
