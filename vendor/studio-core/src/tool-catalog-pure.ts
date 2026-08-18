/**
 * ToolCatalog — compact Kody-shaped action registry.
 */

import { canvasWindowIds } from "./canvas-window-registry-pure.js";
import {
  studioNavKindEnumDescription,
  studioNavKindIds,
} from "./studio-nav-pure.js";
import { tryDescribeSectionAppTool } from "./tool-schemas-section-apps-pure.js";
import { tryDescribeAskUserTool } from "./tool-schemas-ask-user-pure.js";
import { tryDescribeDurableTool } from "./tool-schemas-durable-pure.js";
import { tryDescribeAgentProfileTool } from "./tool-schemas-agent-profile-pure.js";
import {
  DEFAULT_WINDOW_COLOR_PALETTE,
  STUDIO_WINDOW_COLOR_KINDS,
} from "./window-colors-pure.js";

export type ToolActionId =
  | "tools.search"
  | "tools.describe"
  | "tools.call"
  | "files.list"
  | "files.read"
  | "files.write"
  | "files.apply_proposal"
  | "files.discard_proposal"
  | "git.status"
  | "git.diff"
  | "git.commit"
  | "git.push"
  | "git.github.status"
  | "git.github.connect"
  | "open_in_editor"
  | "mcp.list_tools"
  | "mcp.call"
  | "skills.list"
  | "skills.read"
  | "agents.room.list"
  | "agents.room.claim"
  | "agents.spawn"
  | "agents.profile.list"
  | "agents.profile.create"
  | "agents.profile.configure"
  | "durable.run"
  | "durable.runFromRoadmap"
  | "durable.get"
  | "durable.list"
  | "durable.signal"
  | "durable.cancel"
  | "memory.search"
  | "memory.propose"
  | "memory.get"
  | "skills.forge"
  | "deploy.run"
  | "deploy.ship"
  | "deploy.verify"
  | "studio.config.get"
  | "studio.config.patch"
  | "studio.theme.get"
  | "studio.theme.set"
  | "studio.brand.get"
  | "studio.brand.set"
  | "studio.pet.get"
  | "studio.pet.set"
  | "studio.dock.get"
  | "studio.dock.set"
  | "studio.home.get"
  | "studio.home.set"
  | "studio.home.patch"
  | "studio.home.widgets.list"
  | "studio.vision.describe"
  | "studio.windowColors.get"
  | "studio.windowColors.set"
  | "studio.windows.list"
  | "studio.experience.get"
  | "studio.experience.set"
  | "studio.experience.patch"
  | "studio.ask_user"
  | "studio.nav"
  | "studio.chat.send"
  | "studio.chat.focus"
  | "messages.list"
  | "messages.get"
  | "messages.patch"
  | "messages.send"
  | "messages.openInChat"
  | "notes.list"
  | "notes.search"
  | "notes.read"
  | "notes.write"
  | "notes.create"
  | "roadmap.list"
  | "roadmap.add"
  | "roadmap.move"
  | "calendar.list"
  | "calendar.get"
  | "calendar.create"
  | "calendar.update"
  | "calendar.delete"
  | "media.list"
  | "media.get"
  | "media.create"
  | "media.delete"
  | "forms.list"
  | "forms.get"
  | "forms.submit"
  | "sheets.list"
  | "sheets.get"
  | "sheets.put"
  | "data.destinations"
  | "data.tables"
  | "data.rows"
  | "data.insert"
  | "data.update"
  | "data.delete"
  | "notifications.list"
  | "notifications.get"
  | "notifications.emit"
  | "notifications.markRead"
  | "workflows.get"
  | "workflows.save"
  | "workflows.run"
  | "email.campaigns"
  | "email.campaignGet"
  | "email.campaignWrite"
  | "email.campaignSend"
  | "analytics.events"
  | "analytics.ingest"
  | "analytics.funnels"
  | "analytics.funnelsSet"
  | "ops.list"
  | "ops.get"
  | "ops.cancel"
  | "ops.dismiss"
  | "ops.upsert"
  | "design.surfaces"
  | "design.open"
  | "integrations.list"
  | "integrations.write"
  | "integrations.delete"
  | "runtimes.list"
  | "services.start"
  | "services.stop"
  | "services.restart"
  | "convert.status"
  | "convert.presets"
  | "convert.run"
  | "convert.job"
  | "browser.status"
  | "browser.navigate"
  | "browser.click"
  | "browser.type"
  | "browser.keys"
  | "browser.screenshot"
  | "browser.stop"
  | "web.search"
  | "studio.workspace.create"
  | "studio.workspace.switch"
  | "studio.workspace.list"
  | "studio.workspace.get"
  | "studio.workspace.link"
  | "studio.workspace.cloneFromGit"
  | "studio.workspace.patch"
  | "studio.workspace.unlink"
  | "studio.workspace.delete"
  | "secrets.list"
  | "secrets.get"
  | "secrets.set"
  | "secrets.sync"
  | "shell.run";

/** Anthropic Agent surface — progressive discover then execute (not full catalog dump). */
export const HARNESS_PROGRESSIVE_TOOL_IDS: readonly ToolActionId[] = [
  "tools.search",
  "tools.describe",
  "tools.call",
  "skills.list",
  "skills.read",
] as const;

export function isHarnessMetaToolId(id: string): boolean {
  return (
    id === "tools.search" || id === "tools.describe" || id === "tools.call"
  );
}

export type ToolDef = {
  id: ToolActionId;
  description: string;
  /** If true, execute returns a proposal instead of mutating disk. */
  mutatesViaProposal?: boolean;
};

export const STUDIO_TOOL_CATALOG: readonly ToolDef[] = [
  {
    id: "tools.search",
    description:
      "Search Studio tool catalog by keyword — returns id + short description only (not full schemas).",
  },
  {
    id: "tools.describe",
    description:
      "Return full input_schema for one Studio tool id (from tools.search). Call before tools.call when args are unclear.",
  },
  {
    id: "tools.call",
    description:
      "Execute a Studio catalog action (files.*, studio.*, git.*, …). Pass action id + input object. Prefer tools.search/describe first when unsure.",
  },
  {
    id: "files.list",
    description:
      "List files under a path. Project chat: project-relative. Global: @studio or @studio/… (Glass Box Studio monorepo root or relative), @ws/<projectId>/… or projectId + relative path — no Chat scope switch required.",
  },
  {
    id: "files.read",
    description:
      "Read a text file. Project chat: project-relative. Global: @studio/…, @ws/<projectId>/…, or projectId + path.",
  },
  {
    id: "files.write",
    description:
      "Write a file immediately (Keep/Undo follows). Global may target @studio/… or @ws/<projectId>/… without studio.workspace.switch.",
    mutatesViaProposal: true,
  },
  {
    id: "files.apply_proposal",
    description: "Accept a write (Keep) — closes undo window; already on disk",
  },
  {
    id: "files.discard_proposal",
    description: "Undo a write — restore previous disk contents",
  },
  {
    id: "git.status",
    description: "Git status for the current project repo (short + branch)",
  },
  {
    id: "git.diff",
    description: "Git diff (unstaged + staged) for the current project repo",
  },
  {
    id: "git.commit",
    description: "Stage all and commit in the current project repo",
  },
  {
    id: "git.push",
    description:
      "Push current branch (requires Approve on phone/UI unless confirm:true)",
  },
  {
    id: "git.github.status",
    description:
      "Whether GitHub is signed in on this Studio computer (git push login)",
  },
  {
    id: "git.github.connect",
    description:
      "Start GitHub sign-in — returns a phone link + one-time code (or already signed in)",
  },
  {
    id: "open_in_editor",
    description: "Open a project file in the preferred desktop editor",
  },
  {
    id: "mcp.list_tools",
    description:
      "List tools from configured remote MCP servers (n8n, etc.)",
  },
  {
    id: "mcp.call",
    description:
      "Call a tool on a remote MCP server (serverId + tool name + arguments)",
  },
  {
    id: "skills.list",
    description:
      "List agent skills (vendor + Studio .cursor/skills + project). Ids are folder paths (e.g. engineering/mvp-drain).",
  },
  {
    id: "skills.read",
    description:
      "Read full SKILL.md body. Pass path id from skills.list (leaf name OK if unique).",
  },
  {
    id: "agents.room.list",
    description:
      "List live agents in this project's Agent room (siblings, path claims, overlaps). Use before large parallel edits. Peers: call via Studio MCP (glassbox-studio) — same as Anthropic tools.call.",
  },
  {
    id: "agents.room.claim",
    description:
      "Soft-claim file paths in the project room so sibling agents see overlap. Pass chatId (session id) + paths[]. Peers: Studio MCP tools.call — not a private CLI fork.",
  },
  {
    id: "agents.spawn",
    description:
      "Spawn a child agent onto this project's Agent room (Studio subagent plane). Pass parentChatId + optional label/intent/harnessId. Peers and Anthropic share this tool via Studio MCP / tools.call — do not invent a private Task runtime.",
  },
  {
    id: "agents.profile.list",
    description:
      "List Studio crew worker templates (AgentProfile). Harness-agnostic named workers for Ops / Agent room — not Hermes Bot Mode profiles.",
  },
  {
    id: "agents.profile.create",
    description:
      "Create a Studio crew worker template. Pass id (slug) + optional title, harnessId, modelId, petId, peerRef.",
  },
  {
    id: "agents.profile.configure",
    description:
      "Update an existing Studio crew worker template by id. Same fields as create.",
  },
  {
    id: "durable.run",
    description:
      "Start a DurableRuntime background run (chat-background). Does not hijack the interactive harness. Optional wait for task/approved — then durable.signal.",
  },
  {
    id: "durable.runFromRoadmap",
    description:
      "Start a Workflow agent DurableRuntime run from a Roadmap card (template registry). Waiting runs need durable.signal task/approved.",
  },
  {
    id: "durable.get",
    description: "Get one DurableRuntime run by runId (status + steps).",
  },
  {
    id: "durable.list",
    description: "List DurableRuntime runs for the current project (or projectId).",
  },
  {
    id: "durable.signal",
    description:
      "Signal a waiting DurableRuntime run (e.g. event task/approved after operator Approve).",
  },
  {
    id: "durable.cancel",
    description: "Cancel a DurableRuntime run.",
  },
  {
    id: "memory.search",
    description:
      "Search Studio Agent Memory (beliefs/prefs) for this project. Returns top-K hot/warm rows.",
  },
  {
    id: "memory.propose",
    description:
      "Propose a staged Memory row (inbox). Requires Approve in Studio UI before it becomes active.",
  },
  {
    id: "memory.get",
    description: "Get one Memory row by id.",
  },
  {
    id: "skills.forge",
    description:
      "Forge a staged skill candidate from a tool trail (SkillForge-like). Lands in Learn inbox — Approve required.",
  },
  {
    id: "deploy.run",
    description:
      "Run project deploy (hosting.deploy / wrangler). Requires Approve on phone/UI unless confirm:true",
  },
  {
    id: "deploy.ship",
    description:
      "git.push then deploy.run. Requires Approve unless confirm:true",
  },
  {
    id: "deploy.verify",
    description:
      "Check the workspace public site URL loaded (after ship). No Approve.",
  },
  {
    id: "studio.config.get",
    description:
      "Read global Glass Box Studio config (~/.glassbox-studio) — colorMode, theme plugin, AI defaults. Works from any project chat.",
  },
  {
    id: "studio.config.patch",
    description:
      "Patch global Studio config. Common: ui.colorMode light|dark|system; ai.accessMode all|guarded (approvals/catalog); ai.globalFileAccess { studioMonorepo, workspaces: all|none|id[] }; ai.defaultHarness; ai.defaultChatModel; ai.defaultChatMode; ai.responseStyle. Applies Studio-wide.",
  },
  {
    id: "secrets.list",
    description:
      "List Infisical secrets (names only, values redacted). SoT for API keys — env=dev|staging|prod, path=/studio|/cloudflare|/n8n|/host|/browserui. Prefer this over reading .env.local.",
  },
  {
    id: "secrets.get",
    description:
      "Get one Infisical secret value by key. Use sparingly; prefer secrets.set for writes. Do not paste secrets into chat prose after reading.",
  },
  {
    id: "secrets.set",
    description:
      "REQUIRED for new API keys/tokens: upsert into Infisical SoT, merge laptop apps/studio/.env.local, auto-push Cloudflare Worker bindings (GOOGLE_CLIENT_*, SESSION_SECRET, ANTHROPIC_API_KEY). Desk Host pulls within ~15m. Never write secrets only to .env.local.",
  },
  {
    id: "secrets.sync",
    description:
      "Pull Infisical → laptop .env.local and push known Worker secret bindings. Use after bulk Infisical UI edits.",
  },
  {
    id: "studio.theme.get",
    description:
      "Read Studio chrome workspace accent colors (not project Live site). Returns light/dark accent hex.",
  },
  {
    id: "studio.theme.set",
    description:
      "Set Studio chrome / workspace shell colors (accent, fillShell, color maps). Not Live site CSS. Not pet layout. Read skills.read id=chrome for when/never.",
  },
  {
    id: "studio.brand.get",
    description:
      "Read workspace brand mark (name, initials, emoji, logo URL) from .glassbox-studio/design.json. Used for workspace list, home, topbar + chat Studio avatar.",
  },
  {
    id: "studio.brand.set",
    description:
      "Set workspace brand mark — name, initials (1–3 chars), emoji, and/or logo. Writes .glassbox-studio/design.json brand. Pass emoji:\"\" to clear back to letters. Pass logo:\"\" to clear image.",
  },
  {
    id: "studio.pet.get",
    description:
      "Read chat pet config: studio default (conductor), optional project override (design.json), and effective merge. Returns studio, project, effective.",
  },
  {
    id: "studio.pet.set",
    description:
      "Set Codex pet (enabled, id slug, nickname, size). scope: global (default in Glass Box Studio root chat — ~/.glassbox-studio ui.pet) | project (workspace design.json). clear:true removes that scope's pet (project → inherit studio). Read skills.read id=chrome for when/never.",
  },
  {
    id: "studio.dock.get",
    description:
      "Read compact mobile dock tabs: catalog, global config (ui.mobileDock), optional project override (design.json shell.mobileDock), and effective tabs for current scope (global vs workspace).",
  },
  {
    id: "studio.dock.set",
    description:
      "Set compact mobile dock tab order (3–5 ids: nav|files|ai|workspaces|settings|calendar|messages). scope: global (~/.glassbox-studio ui.mobileDock) | project (design.json shell.mobileDock). clear:true removes that scope's override. Read skills.read id=chrome for when/never.",
  },
  {
    id: "studio.home.get",
    description:
      "Read Home DeskPane widget layouts (ui.home). Returns layouts, resolved default layout widgets, grid cols, and a short `summary` for chat. Use before studio.home.patch / set.",
  },
  {
    id: "studio.home.set",
    description:
      "Replace a Home widget layout (default layoutId=default). widgets: [{instanceId, widgetId, col, row, w, h, props?}]. Persists to ~/.glassbox-studio config ui.home.",
  },
  {
    id: "studio.home.patch",
    description:
      "Patch Home widgets: ops add|remove|move|resize|setProps. move: {instanceId,col,row}. resize: {instanceId,w,h} (allowed sizes from widgets.list). Same ops as Edit-mode drag handle / corner resize. Validates collision.",
  },
  {
    id: "studio.home.widgets.list",
    description:
      "List builtin Home widget registry (id, label, kind peek|launch, defaultSize, allowed sizes). Use when choosing widgetId for studio.home.patch add.",
  },
  {
    id: "studio.vision.describe",
    description:
      "Describe a project-relative image (e.g. .scratch/chat-attachments/…). Host vision via Anthropic when ANTHROPIC_API_KEY is set. Use when a CLI peer cannot see pixels natively — pass path from chat attachment materialize.",
  },
  {
    id: "studio.windowColors.get",
    description:
      "Read canvas window / tab color tags (Tailwind hue palette). Returns palette, defaults, global overrides, optional project overrides, and effective kind→hue map. Not workspace shell theme.",
  },
  {
    id: "studio.windowColors.set",
    description:
      "Set or clear a window kind color tag (tab + DeskPane header). kind/hue enums from registry + palette. scope: global (default) | project (.glassbox-studio/design.json). Broadcasts on shell nav WS (event windowColors) — confirm delivered:true when Studio :4400 is open.",
  },
  {
    id: "studio.windows.list",
    description:
      "List Studio DeskPane / canvas window ids (Notes, Roadmap, Code, Live, …) with labels and View-menu groups. Use before studio.nav when unsure which kind to open. Optional projectKind filters visibility (planning hides Live/Forms/…). Notes/Roadmap/Memory are windows — open with studio.nav kind=notes, not filePath to NOTES.md.",
  },
  {
    id: "studio.experience.get",
    description:
      "Read the resolved workspace-rail experience (Nav/Files tabs + nav projection) for the current project/user. Returns workspaceSlots, nav include/exclude/projection, profileId. Use before reorganizing the right-rail Nav.",
  },
  {
    id: "studio.experience.set",
    description:
      "Select a workspace-rail profile by id (builder | nav-only | legal | project-defined). Hides/shows Files tab and applies profile nav filters. Does not rename disk folders.",
  },
  {
    id: "studio.experience.patch",
    description:
      "Patch the user's workspace-rail overlay: workspaceSlots (e.g. [\"nav\"] to hide Files), nav.include/exclude, nav.projection (rename labels, reorder, virtual groups). Projection is display-only — does not rename files on disk. Prefer this when the user asks to reorganize/rename Nav or hide Files.",
  },
  {
    id: "studio.ask_user",
    description:
      "Ask the operator a clarifying question with choice chips (Cursor AskQuestion-style). Parks the turn until they pick (or skip). Prefer this in Plan mode over dumping a long prose questionnaire. Args: question (required), options (1–8 strings or {id,label}), optional allowMultiple.",
  },
  {
    id: "studio.nav",
    description:
      "Control Studio shell navigation: open/close/focus canvas DeskPane windows via kind (notes, roadmap, memory, chat, code, live, settings, … — full enum on kind). Notes/Roadmap/Memory are windows (kind=notes), NOT source files — do not use filePath for NOTES.md unless the user asked to edit that file in Code. Also: Website Preview path (livePath), open a project file (filePath + optional preferDesign/preferLive), Settings/Analytics/Email sections, switch workspace (projectId), left-rail tab, or split layout. Broadcasts to open Studio UI via shell nav bus — confirm delivered:true (Studio :4400 must be open). From global/_studio MCP, pass projectId to enter a workspace then open kinds (e.g. projectId=van-build + kind=notes). To reorganize Nav labels/order/Files tab, use studio.experience.* instead. To switch Chat scope / ledger into a workspace from Global, prefer studio.workspace.switch.",
  },
  {
    id: "studio.chat.send",
    description:
      "Send a message into the open Studio Chat UI (shell intent bus). Opens+focuses Chat, sets composer mode (agent|plan|ask|debug|multitask|workflow), and starts the turn in the browser so the operator sees streaming. Prefer mode=agent. Clone/GitHub jobs must be agent — never multitask / Agent room. Args: text (required), mode, projectId?, chatId?, harness?, focus (default true), newChat (start a new session so a live turn is not queued). Returns delivered + hint if no Studio tab is listening. Same path as CLI `studio chat --ui`.",
  },
  {
    id: "studio.chat.focus",
    description:
      "Switch the open Studio Chat window to a specific chat tab. Args: chatId? (or sessionId), query? (title words like robots or Boston), projectId?. Empty query focuses the other most-recent open tab. Opens Chat if closed. Same path as Voice “bring that chat up”. Returns delivered + hint if no Studio tab is listening.",
  },
  {
    id: "messages.list",
    description:
      "List Studio-global Messages inbox (one latest envelope per conversation). Paginated: limit (default 50, max 100), cursor, hasMore/nextCursor. Filter by conversationId (full thread), folder, channel, status, projectId, untagged, q. Open UI with studio.nav kind=messages.",
  },
  {
    id: "messages.get",
    description:
      "Get one Messages inbox envelope by messageId (full body + meta).",
  },
  {
    id: "messages.patch",
    description:
      "Update Messages envelope status (unread|read|starred|archived). Same store as PATCH /api/messages/:id.",
  },
  {
    id: "messages.send",
    description:
      "Send / reply outbound via Messages inbox (direction=out). Email uses n8n Gmail outbound when configured. Under guarded access mode returns Approve unless confirm:true.",
  },
  {
    id: "messages.openInChat",
    description:
      "Bind a Messages envelope into Chat: opens Chat via shell nav with messageHandoff + returns contextBlock for the agent turn. Prefer this over studio.nav alone when handling an email/slack thread.",
  },
  {
    id: "notes.list",
    description:
      "List Notes vault tree (studio or project scope). Same as GET /api/notes/tree. Open UI with studio.nav kind=notes.",
  },
  {
    id: "notes.search",
    description:
      "Search Notes vault markdown by query. Same as GET /api/notes/search.",
  },
  {
    id: "notes.read",
    description:
      "Read one note by relative path. Same as GET /api/notes/read.",
  },
  {
    id: "notes.write",
    description:
      "Write/overwrite note markdown at path. Same as PUT /api/notes/write.",
  },
  {
    id: "notes.create",
    description:
      "Create a note at path (adds .md if needed). Same as POST /api/notes/create.",
  },
  {
    id: "roadmap.list",
    description:
      "Load Roadmap board (columns + cards) for studio or project scope. Same as GET /api/roadmap. Open UI with studio.nav kind=roadmap.",
  },
  {
    id: "roadmap.add",
    description:
      "Add a Roadmap card. Same as POST /api/roadmap/cards.",
  },
  {
    id: "roadmap.move",
    description:
      "Move a Roadmap card to a column (optional index). Same as POST /api/roadmap/move.",
  },
  {
    id: "calendar.list",
    description:
      "List Studio ledger calendar/events (filter by project, kind, time range). Open UI with studio.nav kind=calendar.",
  },
  {
    id: "calendar.get",
    description: "Get one ledger event by eventId.",
  },
  {
    id: "calendar.create",
    description:
      "Create a ledger calendar event (title + startsAt). Defaults to studio scope from Global chat.",
  },
  {
    id: "calendar.update",
    description: "Patch an existing ledger event (title/startsAt/endsAt/kind/meta).",
  },
  {
    id: "calendar.delete",
    description: "Delete a ledger event by eventId.",
  },
  {
    id: "media.list",
    description:
      "List media library assets (studio or project scope). Same as GET /api/studio/media or /api/projects/:id/media. Open UI with studio.nav kind=media.",
  },
  {
    id: "media.get",
    description: "Get one media asset metadata by assetId (not raw bytes).",
  },
  {
    id: "media.create",
    description:
      "Upload a media asset (filename + dataBase64). Same as POST media routes.",
  },
  {
    id: "media.delete",
    description: "Delete a media asset by assetId.",
  },
  {
    id: "forms.list",
    description:
      "List form inbox submissions for a project. Same as GET /api/projects/:id/forms.",
  },
  {
    id: "forms.get",
    description: "Get one form submission by submissionId.",
  },
  {
    id: "forms.submit",
    description:
      "Submit a form payload (formId + payload). Same as POST /api/projects/:id/forms.",
  },
  {
    id: "sheets.list",
    description:
      "List project sheet workbooks under .glassbox-studio/sheets/. Same as GET /api/projects/:id/sheets.",
  },
  {
    id: "sheets.get",
    description:
      "Read a workbook JSON (creates default if missing). Same as GET …/sheets/file.",
  },
  {
    id: "sheets.put",
    description:
      "Write a workbook JSON. Same as PUT …/sheets/file. CLI: studio sheets put.",
  },
  {
    id: "data.destinations",
    description:
      "List data destinations for a project (+ default records id). Same as GET …/data/destinations.",
  },
  {
    id: "data.tables",
    description: "List tables in a records-capable destination.",
  },
  {
    id: "data.rows",
    description: "Query rows from a table (limit/offset/sort/q).",
  },
  {
    id: "data.insert",
    description: "Insert a row into a writable destination table.",
  },
  {
    id: "data.update",
    description: "Update a row by primary key (pk + values).",
  },
  {
    id: "data.delete",
    description: "Delete a row by primary key.",
  },
  {
    id: "notifications.list",
    description:
      "List Studio notifications (optional unread/source/project filters). Open UI with studio.nav kind=notifications.",
  },
  {
    id: "notifications.get",
    description: "Get one notification by id.",
  },
  {
    id: "notifications.emit",
    description:
      "Emit a notification (respects prefs unless forced via HTTP). Pass source + title (+ body/severity/href).",
  },
  {
    id: "notifications.markRead",
    description: "Mark notification ids as read.",
  },
  {
    id: "workflows.get",
    description:
      "Load automation.json workflows (project or Global _studio). Same as GET /api/projects/:id/automation.",
  },
  {
    id: "workflows.save",
    description:
      "Replace workflows array in automation.json. Same as PUT /api/projects/:id/automation.",
  },
  {
    id: "workflows.run",
    description:
      "Fire a workflow test trigger (n8n webhook). Same as POST /api/projects/:id/automation/test. Pass workflowId + optional payload.",
  },
  {
    id: "email.campaigns",
    description:
      "List portable email campaigns under email/campaigns/. Open UI with studio.nav kind=email.",
  },
  {
    id: "email.campaignGet",
    description: "Get one email campaign by campaignId.",
  },
  {
    id: "email.campaignWrite",
    description: "Upsert an email campaign JSON (id required on campaign).",
  },
  {
    id: "email.campaignSend",
    description:
      "Send a campaign (same as POST .../email/campaigns/:id/send). dryRun defaults true — pass dryRun=false to deliver.",
  },
  {
    id: "analytics.events",
    description: "List analytics events for a project destination.",
  },
  {
    id: "analytics.ingest",
    description: "Ingest one analytics event (name + optional properties).",
  },
  {
    id: "analytics.funnels",
    description:
      "List saved funnel definitions (integrations/analytics.json). Open UI with studio.nav kind=analytics asect=funnels.",
  },
  {
    id: "analytics.funnelsSet",
    description:
      "Replace funnel definitions on the analytics integration. Same as PUT /api/projects/:id/analytics/funnels.",
  },
  {
    id: "ops.list",
    description:
      "List Ops fleet jobs (Host board). Optional status filter. Open UI with studio.nav kind=ops.",
  },
  {
    id: "ops.get",
    description: "Get one Ops fleet job by id.",
  },
  {
    id: "ops.cancel",
    description: "Cancel a running/queued Ops fleet job. Same as POST /api/fleet/jobs/:id/cancel.",
  },
  {
    id: "ops.dismiss",
    description: "Dismiss a job from the Ops board. Same as POST /api/fleet/jobs/:id/dismiss.",
  },
  {
    id: "ops.upsert",
    description: "Create or update an Ops fleet job (id + title). Same as POST /api/fleet.",
  },
  {
    id: "design.surfaces",
    description:
      "List Design window surfaces (home|system|components|chrome). Open with design.open or studio.nav kind=design ds=.",
  },
  {
    id: "design.open",
    description:
      "Open Design focused on a surface (ds=home|system|components|chrome). Same as studio.nav kind=design.",
  },
  {
    id: "integrations.list",
    description:
      "List project integrations/*.json. Open Integrations window with studio.nav kind=integrations.",
  },
  {
    id: "integrations.write",
    description: "Upsert an integration JSON (id + config).",
  },
  {
    id: "integrations.delete",
    description: "Delete an integration file by id.",
  },
  {
    id: "runtimes.list",
    description:
      "Snapshot project runtimes + studio rail services (same as GET /api/runtimes). Open UI with studio.nav kind=runtimes.",
  },
  {
    id: "services.start",
    description:
      "Start a Studio rail service (n8n, voice, …). Same as POST /api/studio-services/:id/start.",
  },
  {
    id: "services.stop",
    description: "Stop a Studio rail service.",
  },
  {
    id: "services.restart",
    description: "Restart a Studio rail service.",
  },
  {
    id: "convert.status",
    description: "Probe Host for ffmpeg/ffprobe availability.",
  },
  {
    id: "convert.presets",
    description: "List FFmpeg converter presets.",
  },
  {
    id: "convert.run",
    description:
      "Start a convert job (presetId + inputPath or inputBase64). Needs ffmpeg on Host.",
  },
  {
    id: "convert.job",
    description: "Get convert job status by jobId.",
  },
  {
    id: "browser.status",
    description:
      "Host Chromium session status (running, url, title). Open UI with studio.nav kind=browser.",
  },
  {
    id: "browser.navigate",
    description:
      "Navigate Host Browser to a URL (starts Chromium lazily). Prefer studio.nav kind=browser so the operator sees the screencast.",
  },
  {
    id: "browser.click",
    description:
      "Click at viewport CSS coordinates in the Host Browser (x, y). Same session as DeskPane screencast.",
  },
  {
    id: "browser.type",
    description:
      "Type text into the focused Host Browser element. Optional clear:true.",
  },
  {
    id: "browser.keys",
    description:
      "Press a key chord in Host Browser (Playwright key — Enter, Escape, Meta+a, …).",
  },
  {
    id: "browser.screenshot",
    description:
      "PNG screenshot of the Host Browser page (base64). Use when you need a still frame.",
  },
  {
    id: "browser.stop",
    description:
      "Quit Host Chromium process (cookies persist on disk). DeskPane close also stops.",
  },
  {
    id: "web.search",
    description:
      "Web search (current facts / docs). Default engine=searxng → local SearXNG JSON (free, no API key; pnpm searxng:dev / SEARXNG_URL). Fallback: Playwright SERP scrape. Pass engine=brave|google to force scrape. Returns title/url/snippet list — not a substitute for repo files.* tools.",
  },
  {
    id: "studio.workspace.create",
    description:
      "Create workspace / new project / planning workspace (notes + roadmap + decisions) under ~/.glassbox-studio/workspaces, register it, and switch Chat scope into it. Use for life/work projects (van build, trip, business plan) — not full app scaffolds. Args: name (required), optional slug, optional brief. From Global: tools.call action=studio.workspace.create.",
  },
  {
    id: "studio.workspace.switch",
    description:
      "Switch Chat scope / ledger + sticky UI binding to a registered workspace id, or Global (projectId=_studio). Optional for file edits — from Global prefer @ws/<id>/… or files.* projectId. Use switch when the user wants that project's Chat history / sticky scope.",
  },
  {
    id: "studio.workspace.list",
    description:
      "List registered workspaces (id, name, path, kind). Prefer before switch/delete.",
  },
  {
    id: "studio.workspace.get",
    description:
      "Get one registered workspace: id, name, path, absPath, kind, project.json config.",
  },
  {
    id: "studio.workspace.link",
    description:
      "Link an existing folder into the Studio registry (CLI studio link parity). Args: id, path, optional name.",
  },
  {
    id: "studio.workspace.cloneFromGit",
    description:
      "Clone a GitHub repo onto this Studio computer and register it as a workspace (switch Chat scope). Args: url (https://github.com/owner/repo or owner/repo), optional id, optional dest under Studio home, optional name. If GitHub is signed out, returns a phone sign-in code — do not shell.run git clone. From Global: tools.call action=studio.workspace.cloneFromGit.",
  },
  {
    id: "studio.workspace.patch",
    description:
      "Rename / update brief / compute.placement / public site URL (hosting.prod_url via prodUrl) for a workspace (registry + project.json / README when writable). placement: hosted | local | byo — iCloud-style app storage (Cloud vs Local).",
  },
  {
    id: "studio.workspace.unlink",
    description:
      "Remove a workspace from the registry only (does not delete files). Always requires Approve in UI or confirm:true. Cannot unlink glassbox-studio.",
  },
  {
    id: "studio.workspace.delete",
    description:
      "Delete workspace: unlink from registry; optional deleteFiles:true removes disk under ~/.glassbox-studio/workspaces only. Double confirm: (1) confirmPhrase must equal project id (or \"delete <id>\"), (2) Approve in UI or confirm:true. Never deletes glassbox-studio or paths outside planning home.",
  },
  {
    id: "shell.run",
    description:
      "Run a shell command on the Studio API host (login shell PATH). Use for CLIs like imsg, brew, node scripts. cwd: project (default) or home. Returns stdout/stderr/exit. macOS imsg needs Full Disk Access for the Node process running Studio API.",
  },
] as const;

/** Anthropic requires `^[a-zA-Z0-9_-]{1,128}$` — no dots. */
export function toAnthropicToolName(id: string): string {
  return id.replace(/\./g, "_");
}

export function fromAnthropicToolName(name: string): ToolActionId {
  const tool = STUDIO_TOOL_CATALOG.find(
    (t) => toAnthropicToolName(t.id) === name,
  );
  if (!tool) throw new Error(`Unknown Anthropic tool name: ${name}`);
  return tool.id;
}

/** True when every query token appears in id or description (AND). */
export function toolMatchesSearchQuery(
  tool: Pick<ToolDef, "id" | "description">,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${tool.id} ${tool.description}`.toLowerCase();
  const tokens = q.split(/[^a-z0-9._-]+/).filter(Boolean);
  if (tokens.length === 0) return true;
  // Full phrase still wins when present.
  if (hay.includes(q)) return true;
  return tokens.every(
    (tok) =>
      tool.id.includes(tok) ||
      tool.description.toLowerCase().includes(tok) ||
      tool.id.split(".").some((p) => p.includes(tok)),
  );
}

export function searchTools(
  query: string,
  allow?: readonly string[],
  opts?: { includeMeta?: boolean },
): ToolDef[] {
  const allowed = allow ? new Set(allow) : null;
  const includeMeta = opts?.includeMeta === true;
  return STUDIO_TOOL_CATALOG.filter((t) => {
    if (!includeMeta && isHarnessMetaToolId(t.id)) return false;
    if (allowed && !allowed.has(t.id)) return false;
    return toolMatchesSearchQuery(t, query);
  });
}

export function resolveAction(
  id: string,
  allow?: readonly string[],
): ToolDef {
  const tool = STUDIO_TOOL_CATALOG.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown action: ${id}`);
  if (allow && !allow.includes(tool.id)) {
    throw new Error(`Action not allowed: ${id}`);
  }
  return tool;
}

function schema(
  description: string,
  properties: Record<string, unknown>,
  required?: string[],
): {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
} {
  return {
    name: "",
    description,
    input_schema: {
      type: "object",
      properties,
      ...(required?.length ? { required } : {}),
    },
  };
}

/** Full schema for one catalog tool (tools.describe / progressive). */
export function describeToolSchema(
  id: string,
  allow?: readonly string[],
): {
  id: ToolActionId;
  description: string;
  input_schema: Record<string, unknown>;
} {
  resolveAction(id, allow);
  const defs = anthropicToolDefinitions([id], { includeMeta: true });
  const def = defs[0];
  if (!def) throw new Error(`No schema for action: ${id}`);
  return {
    id: id as ToolActionId,
    description: def.description,
    input_schema: def.input_schema,
  };
}

/**
 * Anthropic Agent surface — meta trio + skills only (OpenClaw/Kody progressive).
 * Concrete actions run via tools.call → mcpExecute.
 */
export function anthropicHarnessToolDefinitions(
  allow?: readonly string[],
): Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}> {
  const ids: ToolActionId[] = [
    "tools.search",
    "tools.describe",
    "tools.call",
  ];
  if (!allow || allow.includes("skills.list")) ids.push("skills.list");
  if (!allow || allow.includes("skills.read")) ids.push("skills.read");
  return anthropicToolDefinitions(ids, { includeMeta: true });
}

/** Anthropic tool schemas for harness:studio tool_use (full or filtered). */
export function anthropicToolDefinitions(
  allow?: readonly string[],
  opts?: { includeMeta?: boolean },
): Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}> {
  const includeMeta =
    opts?.includeMeta === true ||
    Boolean(allow?.some((id) => isHarnessMetaToolId(id)));
  return searchTools("", allow, { includeMeta }).map((t) => {
    const name = toAnthropicToolName(t.id);
    let def: {
      name: string;
      description: string;
      input_schema: Record<string, unknown>;
    };
    const sectionApp = tryDescribeSectionAppTool(t.id, t.description);
    const askUserTool = tryDescribeAskUserTool(t.id, t.description);
    const durableTool = tryDescribeDurableTool(t.id, t.description);
    const agentProfileTool = tryDescribeAgentProfileTool(t.id, t.description);
    if (sectionApp) {
      def = { name: "", ...sectionApp };
    } else if (askUserTool) {
      def = { name: "", ...askUserTool };
    } else if (durableTool) {
      def = { name: "", ...durableTool };
    } else if (agentProfileTool) {
      def = { name: "", ...agentProfileTool };
    } else if (t.id === "tools.search") {
      def = schema(t.description, {
        query: {
          type: "string",
          description:
            "Keyword filter (empty = list all allowed concrete tools)",
        },
      });
    } else if (t.id === "tools.describe") {
      def = schema(
        t.description,
        {
          action: {
            type: "string",
            description: "Catalog tool id (e.g. files.write, studio.theme.set)",
          },
        },
        ["action"],
      );
    } else if (t.id === "tools.call") {
      def = schema(
        t.description,
        {
          action: {
            type: "string",
            description: "Catalog tool id to execute",
          },
          input: {
            type: "object",
            description:
              "Arguments for that action (from tools.describe schema)",
          },
        },
        ["action"],
      );
    } else if (t.id === "files.list") {
      def = schema(t.description, {
        path: {
          type: "string",
          description:
            'Directory: project-relative, or Global @studio/… / @ws/<projectId>/… (default "")',
        },
        projectId: {
          type: "string",
          description:
            "Global only: registered workspace id when path is relative (alternative to @ws/ prefix)",
        },
      });
    } else if (t.id === "files.read") {
      def = schema(
        t.description,
        {
          path: {
            type: "string",
            description:
              "File path: project-relative, or Global @studio/… / @ws/<projectId>/…",
          },
          projectId: {
            type: "string",
            description:
              "Global only: registered workspace id when path is relative",
          },
        },
        ["path"],
      );
    } else if (t.id === "files.write") {
      def = schema(
        t.description,
        {
          path: {
            type: "string",
            description:
              "File path: project-relative, or Global @studio/… / @ws/<projectId>/…",
          },
          content: { type: "string" },
          projectId: {
            type: "string",
            description:
              "Global only: registered workspace id when path is relative",
          },
        },
        ["path", "content"],
      );
    } else if (
      t.id === "files.apply_proposal" ||
      t.id === "files.discard_proposal"
    ) {
      def = schema(
        t.description,
        { proposalId: { type: "string" } },
        ["proposalId"],
      );
    } else if (t.id === "git.status") {
      def = schema(t.description, {
        projectId: {
          type: "string",
          description:
            "Global only: registered workspace id (default = Studio monorepo when allowed)",
        },
      });
    } else if (t.id === "git.diff") {
      def = schema(t.description, {
        path: {
          type: "string",
          description: "Optional pathspec to limit the diff",
        },
        staged: {
          type: "boolean",
          description: "If true, only staged (--cached) diff",
        },
        projectId: {
          type: "string",
          description: "Global only: registered workspace id",
        },
      });
    } else if (t.id === "git.commit") {
      def = schema(
        t.description,
        {
          message: { type: "string", description: "Commit message" },
          paths: {
            type: "array",
            items: { type: "string" },
            description: "Optional paths to stage (default: all)",
          },
          projectId: {
            type: "string",
            description: "Global only: registered workspace id",
          },
        },
        ["message"],
      );
    } else if (t.id === "git.push") {
      def = schema(t.description, {
        remote: { type: "string", description: 'Remote name (default "origin")' },
        branch: {
          type: "string",
          description: "Branch to push (default: current)",
        },
        projectId: {
          type: "string",
          description: "Global only: registered workspace id",
        },
      });
    } else if (t.id === "git.github.status" || t.id === "git.github.connect") {
      def = schema(t.description, {});
    } else if (t.id === "open_in_editor") {
      def = schema(
        t.description,
        {
          path: { type: "string", description: "Project-relative file path" },
          line: { type: "number", description: "1-based line (default 1)" },
        },
        ["path"],
      );
    } else if (t.id === "mcp.list_tools") {
      def = schema(t.description, {
        serverId: {
          type: "string",
          description: "Optional server id filter (e.g. n8n-local)",
        },
        query: { type: "string", description: "Optional name/description filter" },
      });
    } else if (t.id === "mcp.call") {
      def = schema(
        t.description,
        {
          serverId: { type: "string", description: "MCP server id from config" },
          name: { type: "string", description: "Remote tool name" },
          arguments: {
            type: "object",
            description: "Tool arguments object",
          },
        },
        ["serverId", "name"],
      );
    } else if (t.id === "skills.list") {
      def = schema(t.description, {
        query: { type: "string", description: "Optional filter" },
      });
    } else if (t.id === "skills.read") {
      def = schema(
        t.description,
        { id: { type: "string", description: "Skill path id from skills.list (e.g. engineering/mvp-drain)" } },
        ["id"],
      );
    } else if (t.id === "agents.room.list") {
      def = schema(t.description, {
        chatId: {
          type: "string",
          description:
            "Optional self chat/session id — siblings exclude this id",
        },
      });
    } else if (t.id === "agents.room.claim") {
      def = schema(
        t.description,
        {
          chatId: {
            type: "string",
            description: "This chat/session id (required)",
          },
          paths: {
            type: "array",
            items: { type: "string" },
            description: "Project-relative paths to soft-claim",
          },
          intent: {
            type: "string",
            description: "Short intent shown to siblings",
          },
        },
        ["chatId", "paths"],
      );
    } else if (t.id === "agents.spawn") {
      def = schema(
        t.description,
        {
          parentChatId: {
            type: "string",
            description: "Parent chat/session id (required)",
          },
          childChatId: {
            type: "string",
            description: "Optional child id (auto if omitted)",
          },
          label: { type: "string", description: "Child label" },
          intent: { type: "string", description: "Child intent" },
          harnessId: {
            type: "string",
            description: "Harness id for child (picker default)",
          },
        },
        ["parentChatId"],
      );
    } else if (t.id === "memory.search") {
      def = schema(t.description, {
        q: { type: "string", description: "Search query (optional for hot-only)" },
      });
    } else if (t.id === "memory.propose") {
      def = schema(
        t.description,
        {
          content: { type: "string", description: "Belief / pref text" },
          why: { type: "string", description: "Optional why (use pref:… for prefs)" },
        },
        ["content"],
      );
    } else if (t.id === "memory.get") {
      def = schema(
        t.description,
        { id: { type: "string", description: "Memory row id" } },
        ["id"],
      );
    } else if (t.id === "skills.forge") {
      def = schema(
        t.description,
        {
          userIntent: {
            type: "string",
            description: "What the user asked for",
          },
          toolTrail: {
            type: "array",
            items: { type: "string" },
            description: "Tool names used in the turn",
          },
          sessionId: { type: "string", description: "Optional session id" },
          assistantSummary: {
            type: "string",
            description: "Optional assistant summary notes",
          },
        },
        ["userIntent", "toolTrail"],
      );
    } else if (t.id === "deploy.run") {
      def = schema(t.description, {
        target: {
          type: "string",
          description: "Optional hosting.deploy.targets id",
        },
        confirm: {
          type: "boolean",
          description: "Skip approval UI when true (CLI --yes)",
        },
      });
    } else if (t.id === "deploy.ship") {
      def = schema(t.description, {
        target: { type: "string" },
        remote: { type: "string" },
        branch: { type: "string" },
        confirm: { type: "boolean" },
      });
    } else if (t.id === "deploy.verify") {
      def = schema(t.description, {
        url: {
          type: "string",
          description: "Optional URL to check; default is the workspace site address",
        },
      });
    } else if (t.id === "studio.config.get") {
      def = schema(t.description, {});
    } else if (t.id === "secrets.list") {
      def = schema(t.description, {
        env: {
          type: "string",
          enum: ["dev", "staging", "prod"],
          description: "Infisical environment (default dev)",
        },
        path: {
          type: "string",
          description:
            "Folder path: /studio /cloudflare /n8n /host /browserui /aws /fly (default /studio)",
        },
      });
    } else if (t.id === "secrets.get") {
      def = schema(
        t.description,
        {
          key: {
            type: "string",
            description: "UPPER_SNAKE secret name",
          },
          env: { type: "string", enum: ["dev", "staging", "prod"] },
          path: { type: "string" },
        },
        ["key"],
      );
    } else if (t.id === "secrets.set") {
      def = schema(
        t.description,
        {
          key: {
            type: "string",
            description: "UPPER_SNAKE secret name (e.g. FOO_API_KEY)",
          },
          value: {
            type: "string",
            description: "Secret value (never commit; stored in Infisical)",
          },
          env: {
            type: "string",
            enum: ["dev", "staging", "prod"],
            description: "Default dev (laptop). Use staging/prod for shared/desk.",
          },
          path: {
            type: "string",
            description:
              "Optional folder; default inferred from key prefix (CLOUDFLARE_* → /cloudflare, etc.)",
          },
          skipLaptop: {
            type: "boolean",
            description: "Skip merging apps/studio/.env.local",
          },
          skipCloud: {
            type: "boolean",
            description: "Skip Cloudflare Worker secret put",
          },
        },
        ["key", "value"],
      );
    } else if (t.id === "secrets.sync") {
      def = schema(t.description, {
        env: { type: "string", enum: ["dev", "staging", "prod"] },
        pushCloud: {
          type: "boolean",
          description: "Push Worker bindings (default true)",
        },
      });
    } else if (t.id === "studio.config.patch") {
      def = schema(
        t.description,
        {
          ui: {
            type: "object",
            description: "Partial ui patch — colorMode, theme.plugin, panels",
          },
          ai: {
            type: "object",
            description:
              "Partial ai patch — accessMode, globalFileAccess, defaultChatMode, defaultHarness, defaultChatModel, responseStyle",
            properties: {
              accessMode: {
                type: "string",
                enum: ["all", "guarded"],
                description:
                  "all = full catalog + auto-approve push/deploy; guarded = allowlists + approvals (not the Global file-root gate)",
              },
              globalFileAccess: {
                type: "object",
                description:
                  "Global Chat disk roots: studioMonorepo (bool), workspaces (all|none|string[])",
                properties: {
                  studioMonorepo: { type: "boolean" },
                  workspaces: {
                    description: '"all" | "none" | string[] of project ids',
                  },
                },
              },
              defaultChatMode: { type: "string" },
              defaultHarness: { type: "string" },
              defaultChatModel: {
                type: "string",
                description: "Composer model id for the default harness",
              },
              responseStyle: { type: "object" },
            },
          },
          editor: { type: "object", description: "Partial editor patch" },
        },
        [],
      );
    } else if (t.id === "studio.theme.get") {
      def = schema(t.description, {});
    } else if (t.id === "studio.theme.set") {
      def = schema(
        t.description,
        {
          accent: {
            type: "string",
            description:
              "Light accent — hex (#10b981) or named color (yellow, green, purple, blue, …). Defaults to painting full shell fill.",
          },
          accentDark: {
            type: "string",
            description:
              "Dark accent — hex or named color. Defaults with accent when omitted for named colors.",
          },
          fillShell: {
            type: "boolean",
            description:
              "Paint bg.canvas/surface/sidebar/muted as a hue scale from accent (washes — not monochrome). Default true for accent shortcuts; set false for accent-chip-only.",
          },
          color: {
            type: "object",
            description:
              "Light shell/token map — groups bg, fg, border, status. Ex: { bg: { sidebar: \"#0f172a\", muted: \"#1e293b\" }, fg: { accent: \"#10b981\", onAccent: \"#fff\" } }",
          },
          colorDark: {
            type: "object",
            description:
              "Dark shell/token map — same shape as color",
          },
        },
        [],
      );
    } else if (t.id === "studio.brand.get") {
      def = schema(t.description, {});
    } else if (t.id === "studio.brand.set") {
      def = schema(
        t.description,
        {
          name: {
            type: "string",
            description: "Display name for the workspace brand mark",
          },
          initials: {
            type: "string",
            description: "1–3 letter mark when no logo image",
          },
          logo: {
            type: "string",
            description:
              "Image URL/path for the mark (topbar + chat avatar). Empty string or null clears.",
          },
          emoji: {
            type: "string",
            description:
              "Emoji mark for the workspace list and home. Empty string or null clears back to letters.",
          },
        },
        [],
      );
    } else if (t.id === "studio.pet.get") {
      def = schema(t.description, {});
    } else if (t.id === "studio.pet.set") {
      def = schema(
        t.description,
        {
          scope: {
            type: "string",
            description:
              "global (Studio default in ~/.glassbox-studio) | project (design.json). Default: global in Glass Box Studio root chat, else project.",
          },
          clear: {
            type: "boolean",
            description:
              "When true, clear pet at this scope (project → inherit studio default).",
          },
          enabled: {
            type: "boolean",
            description: "Show the toolbar pixel pet (default true)",
          },
          id: {
            type: "string",
            description:
              "Codex pet slug from codex-pet.com or petdex.dev (e.g. airring, battle-beast, boba). Shipped previews: airring, battle-beast.",
          },
          name: {
            type: "string",
            description:
              "Optional nickname shown in chat (max 32 chars). Empty string or null clears to the catalog / slug label.",
          },
          size: {
            type: "number",
            description: "Render size in px (16–64, default 28)",
          },
        },
        [],
      );
    } else if (t.id === "studio.dock.get") {
      def = schema(t.description, {});
    } else if (t.id === "studio.dock.set") {
      def = schema(
        t.description,
        {
          scope: {
            type: "string",
            description:
              "global (~/.glassbox-studio ui.mobileDock) | project (design.json shell.mobileDock). Default: global in Glass Box Studio root chat, else project.",
          },
          clear: {
            type: "boolean",
            description:
              "When true, clear dock override at this scope (project → workspace defaults; global → global defaults).",
          },
          tabs: {
            type: "array",
            description:
              "3–5 dock tab ids in order: nav, files, ai, workspaces, settings, calendar, messages",
            items: { type: "string" },
          },
        },
        [],
      );
    } else if (t.id === "studio.home.get") {
      def = schema(
        t.description,
        {
          layoutId: {
            type: "string",
            description: "Layout id (default: default)",
          },
        },
        [],
      );
    } else if (t.id === "studio.home.set") {
      def = schema(
        t.description,
        {
          layoutId: {
            type: "string",
            description: "Layout id to replace (default: default)",
          },
          widgets: {
            type: "array",
            description:
              "Full widget list: instanceId, widgetId, col, row, w, h, optional props",
            items: { type: "object" },
          },
        },
        ["widgets"],
      );
    } else if (t.id === "studio.home.patch") {
      def = schema(
        t.description,
        {
          layoutId: {
            type: "string",
            description: "Layout id (default: default)",
          },
          ops: {
            type: "array",
            description:
              "Patch ops: {op:add|remove|move|resize|setProps, …}. add needs widgetId; remove/move/resize/setProps need instanceId.",
            items: { type: "object" },
          },
        },
        ["ops"],
      );
    } else if (t.id === "studio.home.widgets.list") {
      def = schema(t.description, {});
    } else if (t.id === "studio.vision.describe") {
      def = schema(
        t.description,
        {
          path: {
            type: "string",
            description:
              "Project-relative image path (e.g. .scratch/chat-attachments/t1/shot.png)",
          },
          question: {
            type: "string",
            description: "Optional focus question for the vision model",
          },
        },
        ["path"],
      );
    } else if (t.id === "studio.windowColors.get") {
      def = schema(t.description, {});
    } else if (t.id === "studio.windows.list") {
      def = schema(
        t.description,
        {
          projectKind: {
            type: "string",
            description:
              'Workspace kind filter (e.g. "planning" | "app"). Empty = app (full set).',
          },
          visibleOnly: {
            type: "boolean",
            description:
              "When false, list every registry window including app-only ones. Default true.",
          },
        },
        [],
      );
    } else if (t.id === "studio.windowColors.set") {
      const hueIds = DEFAULT_WINDOW_COLOR_PALETTE.map((h) => h.id);
      def = schema(
        t.description,
        {
          kind: {
            type: "string",
            enum: [...STUDIO_WINDOW_COLOR_KINDS],
            description: `Window kind (${[...canvasWindowIds()].join("|")}).`,
          },
          hue: {
            type: "string",
            enum: [...hueIds, "default", "clear", ""],
            description:
              "Palette hue id. Pass empty, default, or clear to remove override.",
          },
          scope: {
            type: "string",
            enum: ["global", "project"],
            description: "Where to write. Default global.",
          },
        },
        ["kind"],
      );
    } else if (t.id === "studio.experience.get") {
      def = schema(t.description, {
        projectId: {
          type: "string",
          description: "Workspace id (optional when MCP scope already has one).",
        },
      });
    } else if (t.id === "studio.experience.set") {
      def = schema(
        t.description,
        {
          profileId: {
            type: "string",
            description: "Profile id: builder | nav-only | legal | custom.",
          },
          projectId: {
            type: "string",
            description: "Workspace id (optional when scoped).",
          },
        },
        ["profileId"],
      );
    } else if (t.id === "studio.experience.patch") {
      def = schema(t.description, {
        projectId: {
          type: "string",
          description: "Workspace id (optional when scoped).",
        },
        workspaceSlots: {
          type: "array",
          items: { type: "string" },
          description: 'Tabs to show, e.g. ["nav"] or ["nav","files"].',
        },
        profileId: {
          type: "string",
          description: "Optional profile id to select while patching.",
        },
        nav: {
          type: "object",
          description:
            "Nav experience: { include?, exclude?, projection?: [{ id, label?, children?, virtual?, hidden? }] }",
        },
        studioPanels: {
          type: "object",
          description: '{ include?: string[], exclude?: string[] } — use exclude:["*"] to hide Studio panel sections',
        },
      });
    } else if (t.id === "studio.nav") {
      const kindIds = [...studioNavKindIds()];
      const kindPipe = studioNavKindEnumDescription();
      def = schema(
        t.description,
        {
          kind: {
            type: "string",
            enum: kindIds,
            description: `Canvas DeskPane window id (${kindPipe}). Use kind=notes|roadmap|memory for those apps — not filePath.`,
          },
          kinds: {
            type: "array",
            items: { type: "string", enum: kindIds },
            description: "Windows to open (or close when close=true); focus defaults to last.",
          },
          focus: {
            type: "string",
            enum: kindIds,
            description: "Which opened window stays active (default: last kind).",
          },
          close: {
            type: "boolean",
            description: "When true, close the listed kinds instead of opening.",
          },
          action: {
            type: "string",
            description: 'Alias: "close" sets close=true.',
          },
          livePath: {
            type: "string",
            description:
              "Website Preview site path (e.g. / or /pricing). Opens live if needed.",
          },
          filePath: {
            type: "string",
            description:
              "Project-relative source file (e.g. content/pages/home.md). Opens Code unless preferDesign/preferLive.",
          },
          preferDesign: {
            type: "boolean",
            description: "With filePath: open Design (and Code) focused on Design.",
          },
          preferLive: {
            type: "boolean",
            description: "With filePath: open Live + Code focused on Live.",
          },
          path: {
            type: "string",
            description:
              "Alias: leading / or bare route → livePath; nested/extension → filePath.",
          },
          ssect: {
            type: "string",
            description:
              "Settings section: profile|general|startup|ai|harnesses|models|mcp-tools|integrations|skills|rules|apps.",
          },
          asect: {
            type: "string",
            description:
              "Analytics section: overview|funnels|tracking-plan|events.",
          },
          emailTab: {
            type: "string",
            description: "Email tab: campaigns|audiences|deliverability.",
          },
          ds: {
            type: "string",
            description:
              "Design surface: home|system|components|chrome. Opens design if needed.",
          },
          projectId: {
            type: "string",
            description: "Switch workspace (?project=).",
          },
          tab: {
            type: "string",
            enum: ["nav", "files", "ai"],
            description: "Left rail tab: nav|files|ai.",
          },
          layout: {
            type: "string",
            enum: ["split", "single"],
            description: 'DeskPane layout: "split" or "single".',
          },
          splitPanes: {
            type: "array",
            items: { type: "string", enum: kindIds },
            description: "Kinds to tile when layout=split (e.g. [code, live]).",
          },
          splitRatio: {
            type: "number",
            description: "Left pane fraction when split (0.2–0.8).",
          },
        },
        [],
      );
    } else if (t.id === "studio.chat.send") {
      def = schema(
        t.description,
        {
          text: {
            type: "string",
            description: "User message to send in Studio Chat (required).",
          },
          message: {
            type: "string",
            description: "Alias for text.",
          },
          mode: {
            type: "string",
            enum: ["agent", "plan", "ask", "debug", "multitask", "workflow"],
            description:
              "Composer mode (default agent). Use multitask for Agent room.",
          },
          projectId: {
            type: "string",
            description: "Workspace id (optional; UI may already be scoped).",
          },
          chatId: {
            type: "string",
            description: "Existing chat/session id (optional).",
          },
          harness: {
            type: "string",
            description:
              "Optional peer harness id for Agent/Plan/Ask (ignored for Multitask→agent-room).",
          },
          focus: {
            type: "boolean",
            description: "Open+focus Chat (default true).",
          },
          newChat: {
            type: "boolean",
            description:
              "Start a new Chat session before send (Voice jobs; skip queue on a live turn).",
          },
        },
        ["text"],
      );
    } else if (t.id === "studio.chat.focus") {
      def = schema(
        t.description,
        {
          chatId: {
            type: "string",
            description: "Existing chat/session id (optional).",
          },
          sessionId: {
            type: "string",
            description: "Alias for chatId.",
          },
          query: {
            type: "string",
            description:
              "Title words to match (e.g. robots, Boston, tesla). Empty = other open tab.",
          },
          q: {
            type: "string",
            description: "Alias for query.",
          },
          projectId: {
            type: "string",
            description: "Workspace color/context id (optional).",
          },
        },
        [],
      );
    } else if (t.id === "studio.workspace.create") {
      def = schema(
        t.description,
        {
          name: {
            type: "string",
            description: "Display name for the planning workspace.",
          },
          slug: {
            type: "string",
            description: "Optional id/folder slug (default: slugified name).",
          },
          brief: {
            type: "string",
            description: "Short project brief for README / context.",
          },
        },
        ["name"],
      );
    } else if (t.id === "studio.workspace.switch") {
      def = schema(
        t.description,
        {
          projectId: {
            type: "string",
            description:
              "Registered workspace id, or _studio / empty for Global chat.",
          },
        },
        ["projectId"],
      );
    } else if (t.id === "studio.workspace.list") {
      def = schema(t.description, {});
    } else if (t.id === "studio.workspace.get") {
      def = schema(
        t.description,
        {
          projectId: {
            type: "string",
            description: "Registered workspace id.",
          },
        },
        ["projectId"],
      );
    } else if (t.id === "studio.workspace.link") {
      def = schema(
        t.description,
        {
          id: {
            type: "string",
            description: "Registry id (slug).",
          },
          path: {
            type: "string",
            description: "Absolute path or path relative to Studio repo root.",
          },
          name: {
            type: "string",
            description: "Optional display name.",
          },
        },
        ["id", "path"],
      );
    } else if (t.id === "studio.workspace.cloneFromGit") {
      def = schema(
        t.description,
        {
          url: {
            type: "string",
            description: "GitHub https URL or owner/repo.",
          },
          id: {
            type: "string",
            description: "Optional registry id (default: repo name).",
          },
          dest: {
            type: "string",
            description:
              "Optional dest folder under Studio home (default: ~/.glassbox-studio/workspaces/<id>).",
          },
          name: {
            type: "string",
            description: "Optional display name.",
          },
        },
        ["url"],
      );
    } else if (t.id === "studio.workspace.patch") {
      def = schema(
        t.description,
        {
          projectId: {
            type: "string",
            description: "Registered workspace id.",
          },
          name: {
            type: "string",
            description: "New display name.",
          },
          brief: {
            type: "string",
            description: "Optional README brief rewrite.",
          },
        },
        ["projectId"],
      );
    } else if (t.id === "studio.workspace.unlink") {
      def = schema(
        t.description,
        {
          projectId: {
            type: "string",
            description: "Registered workspace id to unlink.",
          },
          confirm: {
            type: "boolean",
            description:
              "Skip Approve bar (CLI --yes). UI Approve also sets this.",
          },
        },
        ["projectId"],
      );
    } else if (t.id === "studio.workspace.delete") {
      def = schema(
        t.description,
        {
          projectId: {
            type: "string",
            description: "Registered workspace id to delete.",
          },
          deleteFiles: {
            type: "boolean",
            description:
              "When true, also delete disk under ~/.glassbox-studio/workspaces/<id>.",
          },
          confirmPhrase: {
            type: "string",
            description:
              "Required: must equal projectId or \"delete <projectId>\".",
          },
          confirm: {
            type: "boolean",
            description:
              "Second confirm after phrase — Approve bar or CLI --yes.",
          },
        },
        ["projectId", "confirmPhrase"],
      );
    } else if (t.id === "shell.run") {
      def = schema(
        t.description,
        {
          command: {
            type: "string",
            description:
              "Shell command to run (e.g. imsg chats --limit 5 --json)",
          },
          cwd: {
            type: "string",
            enum: ["project", "home"],
            description:
              "Working directory: project root (default) or user home",
          },
          timeoutMs: {
            type: "number",
            description: "Timeout in ms (1000–120000, default 30000)",
          },
        },
        ["command"],
      );
    } else if (t.id === "messages.list") {
      def = schema(t.description, {
        conversationId: {
          type: "string",
          description: "Filter to one conversation/thread id.",
        },
        channel: {
          type: "string",
          enum: [
            "email",
            "slack",
            "telegram",
            "whatsapp",
            "sms",
            "webhook",
            "other",
          ],
          description: "Channel filter.",
        },
        status: {
          type: "string",
          enum: ["unread", "read", "starred", "archived"],
          description: "Status filter.",
        },
        limit: {
          type: "number",
          description: "Page size (1–100, default 50). Inbox lists conversations.",
        },
        cursor: {
          type: "string",
          description: "Keyset cursor from the previous page's nextCursor.",
        },
        folder: {
          type: "string",
          enum: ["all", "email", "chats", "starred", "archived"],
          description: "Conversation folder (ignored with conversationId).",
        },
        q: {
          type: "string",
          description: "Search body, subject, and from.",
        },
        projectId: {
          type: "string",
          description:
            "Filter by project tag; omit for all; empty/untagged for untagged only.",
        },
        untagged: {
          type: "boolean",
          description: "When true, only untagged (studio-global) messages.",
        },
      });
    } else if (t.id === "messages.get" || t.id === "messages.openInChat") {
      def = schema(
        t.description,
        {
          messageId: {
            type: "string",
            description: "Message id (msg_…).",
          },
        },
        ["messageId"],
      );
    } else if (t.id === "messages.patch") {
      def = schema(
        t.description,
        {
          messageId: {
            type: "string",
            description: "Message id (msg_…).",
          },
          status: {
            type: "string",
            enum: ["unread", "read", "starred", "archived"],
            description: "New status.",
          },
        },
        ["messageId", "status"],
      );
    } else if (t.id === "messages.send") {
      def = schema(
        t.description,
        {
          conversationId: {
            type: "string",
            description: "Thread / conversation id to reply into.",
          },
          channel: {
            type: "string",
            enum: [
              "email",
              "slack",
              "telegram",
              "whatsapp",
              "sms",
              "webhook",
              "other",
            ],
            description: "Outbound channel.",
          },
          body: {
            type: "object",
            description: "{ text, html? } — text required.",
          },
          text: {
            type: "string",
            description: "Alias for body.text.",
          },
          to: {
            type: "object",
            description: "{ name?, address? } recipient.",
          },
          from: {
            type: "object",
            description: "{ name?, address? } sender (optional).",
          },
          projectId: {
            type: "string",
            description: "Optional project tag.",
          },
          meta: {
            type: "object",
            description: "Channel meta (subject, gmailThreadId, …).",
          },
          confirm: {
            type: "boolean",
            description:
              "Skip Approve bar under guarded mode (CLI --yes / UI Approve).",
          },
        },
        ["conversationId", "channel"],
      );
    } else if (t.id === "web.search") {
      def = schema(
        t.description,
        {
          query: {
            type: "string",
            description: "Search query string.",
          },
          engine: {
            type: "string",
            enum: ["searxng", "brave", "google"],
            description:
              'Search backend (default "searxng" = local SearXNG JSON). Use brave|google for Playwright SERP scrape.',
          },
          limit: {
            type: "number",
            description: "Max results (1–10, default 5).",
          },
        },
        ["query"],
      );
    } else {
      def = schema(t.description, {});
    }
    return { ...def, name };
  });
}
