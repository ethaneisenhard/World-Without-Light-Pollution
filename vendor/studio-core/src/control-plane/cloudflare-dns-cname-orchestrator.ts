/**
 * Cloudflare DNS CNAME for per-tenant workflows hosts.
 * DNS-only (proxied: false) so the Studio Worker never owns the name.
 */

export type CloudflareDnsCnameDeps = {
  fetch: typeof fetch;
  apiToken: string;
  /** Default https://api.cloudflare.com/client/v4 */
  apiBase?: string;
};

export type CreateDnsCnameInput = {
  zoneId: string;
  /** Relative name e.g. `workflows.acme` */
  name: string;
  /** Target e.g. `bu-xxx-n8n.fly.dev` */
  content: string;
  /** Must stay false — CF orange-cloud would steal TLS from Fly. */
  proxied?: false;
};

export type CreateDnsCnameResult =
  | { ok: true; id: string; name: string; existed?: boolean }
  | { ok: false; error: string };

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token.trim()}`,
    "Content-Type": "application/json",
  };
}

async function readCfError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const parsed = JSON.parse(text) as {
      errors?: { message?: string; code?: number }[];
    };
    const msg = parsed.errors
      ?.map((e) => e.message)
      .filter(Boolean)
      .join("; ");
    if (msg) return msg;
  } catch {
    /* plain */
  }
  return text.slice(0, 400) || `http_${res.status}`;
}

/**
 * Upsert a DNS-only CNAME. If an identical record exists, treat as success.
 */
export async function createCloudflareDnsCname(
  deps: CloudflareDnsCnameDeps,
  input: CreateDnsCnameInput,
): Promise<CreateDnsCnameResult> {
  const name = input.name.trim().toLowerCase();
  const content = input.content.trim().toLowerCase().replace(/\.$/, "");
  const zoneId = input.zoneId.trim();
  if (!name || !content || !zoneId) {
    return { ok: false, error: "dns_cname_missing_fields" };
  }
  const base = deps.apiBase ?? "https://api.cloudflare.com/client/v4";
  const listUrl = `${base}/zones/${encodeURIComponent(zoneId)}/dns_records?type=CNAME&name=${encodeURIComponent(name)}`;
  const listed = await deps.fetch(listUrl, {
    headers: authHeaders(deps.apiToken),
  });
  if (listed.ok) {
    const body = (await listed.json()) as {
      result?: Array<{ id?: string; name?: string; content?: string }>;
    };
    const hit = (body.result ?? []).find(
      (r) =>
        r.id &&
        (r.content ?? "").replace(/\.$/, "").toLowerCase() === content,
    );
    if (hit?.id) {
      return { ok: true, id: hit.id, name, existed: true };
    }
    const conflict = (body.result ?? []).find((r) => r.id);
    if (conflict?.id) {
      const patch = await deps.fetch(
        `${base}/zones/${encodeURIComponent(zoneId)}/dns_records/${encodeURIComponent(conflict.id)}`,
        {
          method: "PATCH",
          headers: authHeaders(deps.apiToken),
          body: JSON.stringify({
            type: "CNAME",
            name,
            content,
            proxied: false,
            ttl: 1,
          }),
        },
      );
      if (!patch.ok) return { ok: false, error: await readCfError(patch) };
      return { ok: true, id: conflict.id, name, existed: true };
    }
  }

  const res = await deps.fetch(
    `${base}/zones/${encodeURIComponent(zoneId)}/dns_records`,
    {
      method: "POST",
      headers: authHeaders(deps.apiToken),
      body: JSON.stringify({
        type: "CNAME",
        name,
        content,
        proxied: false,
        ttl: 1,
      }),
    },
  );
  if (!res.ok) return { ok: false, error: await readCfError(res) };
  const created = (await res.json()) as { result?: { id?: string } };
  const id = created.result?.id;
  if (!id) return { ok: false, error: "dns_cname_missing_id" };
  return { ok: true, id, name };
}
