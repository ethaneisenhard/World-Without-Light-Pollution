# Email Studio (project folder)

Portable defs. Sender provider swappable via `project.json` → `providers.email`.

```
email/
  campaigns/*.json       # stable id + audienceId + subject + EmailBuilder document
  audiences/*.json       # segment filters over project `users`
  deliverability.json    # domain + SPF/DKIM/DMARC checklist flags
```

**People:** project D1/SQLite `users` table (not Studio auth). Form submit with `integrations/forms.json` → `upsertUsers: true` upserts leads.

**Audiences:** `email/audiences/*.json` filters over those users:

| `filter.type` | Matches |
| --- | --- |
| `all` | every user |
| `roles` | any of `roles: []` |
| `tags` | `attrs.tags` overlap |
| `formId` | `source: form:<id>` or `attrs.formId` |
| `emails` | static allowlist (VIP / press lists) |

**Merge tags:** EmailBuilder does **not** resolve them. Use **Insert Field** (subject toolbar + Text / Heading / Button / HTML inspectors) to pick Name / Email / custom attrs from project users — inserts `{{key}}` at the caret. `sendCampaignOrchestrator` fills per recipient via `emailVarsFromUser` at send time. Optional send body `vars` overrides.

**Templates:** Email Studio embeds [EmailBuilder.js](https://github.com/usewaypoint/email-builder-js) (block editor). Campaign JSON stores:

- `document` — EmailBuilder document (edit source of truth)
- `bodyHtml` — rendered HTML for send
- `subject` / `bodyText` — support `{{name}}`, `{{email}}`, plus scalar `attrs`

**Save:** `PUT /api/projects/:projectId/email/campaigns/:campaignId`  
Body: `{ label, subject, from, audienceId, bodyText, bodyHtml, document }`

**Send (n8n):** `POST /api/projects/:projectId/email/campaigns/:campaignId/send`  
Optional: `{ "to": "…", "vars": { "name": "Ada" }, "dryRun": true }`. Copy **campaign id** (or send path) from Email Studio toolbar → n8n HTTP Request.

**Providers:** starter defaults `@glassbox-studio/email-cloudflare` (falls back to dry-run until `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_EMAIL_API_TOKEN`).

**Build editor assets:** `pnpm --filter @glassbox-studio/app build:email-builder` → `apps/studio/public/email-builder/`
