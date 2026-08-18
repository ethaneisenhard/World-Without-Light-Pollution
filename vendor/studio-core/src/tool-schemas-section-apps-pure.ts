/**
 * Anthropic/MCP input schemas for section-app tools (notes / roadmap / calendar).
 * Kept out of tool-catalog-pure.ts (already ≥1000 lines).
 */

function schema(
  description: string,
  properties: Record<string, unknown>,
  required?: string[],
): {
  description: string;
  input_schema: Record<string, unknown>;
} {
  return {
    description,
    input_schema: {
      type: "object",
      properties,
      ...(required?.length ? { required } : {}),
    },
  };
}

const SCOPE_PROPS = {
  scope: {
    type: "string",
    enum: ["studio", "project"],
    description:
      "Vault/board scope. Default: studio from Global chat, project from workspace chat.",
  },
  projectId: {
    type: "string",
    description: "Required when scope=project (defaults to current chat workspace).",
  },
} as const;

/** Returns schema for section-app tools, or null if id is not owned. */
export function tryDescribeSectionAppTool(
  id: string,
  description: string,
): {
  description: string;
  input_schema: Record<string, unknown>;
} | null {
  if (id === "notes.list") {
    return schema(description, { ...SCOPE_PROPS });
  }
  if (id === "notes.search") {
    return schema(
      description,
      {
        ...SCOPE_PROPS,
        query: { type: "string", description: "Search query (alias: q)." },
        q: { type: "string", description: "Alias for query." },
        limit: { type: "number", description: "Max hits (1–100)." },
      },
    );
  }
  if (id === "notes.read" || id === "notes.create") {
    return schema(
      description,
      {
        ...SCOPE_PROPS,
        path: {
          type: "string",
          description: "Relative note path under the vault (e.g. Studio/foo.md).",
        },
        content: {
          type: "string",
          description: "Markdown body (create only; optional — default title stub).",
        },
      },
      ["path"],
    );
  }
  if (id === "notes.write") {
    return schema(
      description,
      {
        ...SCOPE_PROPS,
        path: { type: "string", description: "Relative note path." },
        content: { type: "string", description: "Full markdown content." },
      },
      ["path", "content"],
    );
  }

  if (id === "roadmap.list") {
    return schema(description, { ...SCOPE_PROPS });
  }
  if (id === "roadmap.add") {
    return schema(
      description,
      {
        ...SCOPE_PROPS,
        title: { type: "string", description: "Card title." },
        body: { type: "string", description: "Optional card body." },
        columnId: { type: "string", description: "Column id (default first column)." },
        linkProjectId: {
          type: "string",
          description: "Optional project link on the card.",
        },
      },
      ["title"],
    );
  }
  if (id === "roadmap.move") {
    return schema(
      description,
      {
        ...SCOPE_PROPS,
        cardId: { type: "string", description: "Card id." },
        columnId: { type: "string", description: "Target column id." },
        toIndex: { type: "number", description: "Optional index in column." },
      },
      ["cardId", "columnId"],
    );
  }

  if (id === "calendar.list") {
    return schema(description, {
      scope: {
        type: "string",
        enum: ["studio", "project"],
        description: "Filter by ledger scope.",
      },
      projectId: {
        type: "string",
        description: "Filter by project (null/omit for broader list).",
      },
      kind: { type: "string", description: "Single kind filter." },
      kinds: {
        type: "array",
        items: { type: "string" },
        description: "Kind filters (e.g. calendar, chat).",
      },
      from: {
        type: "number",
        description: "Start range (epoch ms or pass ISO via string).",
      },
      to: { type: "number", description: "End range (epoch ms)." },
      limit: { type: "number", description: "Max events (1–500)." },
    });
  }
  if (id === "calendar.get" || id === "calendar.delete") {
    return schema(
      description,
      {
        eventId: { type: "string", description: "Ledger event id (alias: id)." },
        id: { type: "string", description: "Alias for eventId." },
      },
      ["eventId"],
    );
  }
  if (id === "calendar.create") {
    return schema(
      description,
      {
        title: { type: "string", description: "Event title." },
        startsAt: {
          type: "number",
          description: "Start time (epoch ms; ISO string also accepted).",
        },
        endsAt: {
          type: "number",
          description: "Optional end (epoch ms); null = open-ended.",
        },
        kind: {
          type: "string",
          description: 'Ledger kind (default "calendar").',
        },
        scope: {
          type: "string",
          enum: ["studio", "project"],
          description: "Where the event lives.",
        },
        projectId: { type: "string", description: "Required for scope=project." },
        meta: { type: "object", description: "Optional meta bag." },
        sessionId: { type: "string", description: "Optional chat session link." },
      },
      ["title", "startsAt"],
    );
  }
  if (id === "calendar.update") {
    return schema(
      description,
      {
        eventId: { type: "string", description: "Ledger event id." },
        title: { type: "string" },
        startsAt: { type: "number" },
        endsAt: { type: "number" },
        kind: { type: "string" },
        meta: { type: "object" },
      },
      ["eventId"],
    );
  }

  const PROJECT = {
    projectId: {
      type: "string",
      description: "Workspace id (defaults to current chat workspace).",
    },
  } as const;

  if (id === "media.list") {
    return schema(description, {
      ...SCOPE_PROPS,
      tag: { type: "string", description: "Optional tag filter." },
    });
  }
  if (id === "media.get" || id === "media.delete") {
    return schema(
      description,
      {
        ...SCOPE_PROPS,
        assetId: { type: "string", description: "Media asset id (alias: id)." },
        id: { type: "string", description: "Alias for assetId." },
      },
      ["assetId"],
    );
  }
  if (id === "media.create") {
    return schema(
      description,
      {
        ...SCOPE_PROPS,
        filename: { type: "string" },
        dataBase64: { type: "string", description: "File bytes as base64." },
        contentType: { type: "string" },
        alt: { type: "string" },
        id: { type: "string", description: "Optional asset id to overwrite." },
      },
      ["filename", "dataBase64"],
    );
  }

  if (id === "forms.list") {
    return schema(description, {
      ...PROJECT,
      formId: { type: "string", description: "Optional form id filter." },
      destination: { type: "string", description: "Forms destination id." },
    });
  }
  if (id === "forms.get") {
    return schema(
      description,
      {
        ...PROJECT,
        submissionId: { type: "string", description: "Submission id (alias: id)." },
        destination: { type: "string" },
      },
      ["submissionId"],
    );
  }
  if (id === "forms.submit") {
    return schema(
      description,
      {
        ...PROJECT,
        formId: { type: "string" },
        payload: { type: "object", description: "Form field values." },
        destination: { type: "string" },
      },
      ["formId", "payload"],
    );
  }

  if (id === "sheets.list") {
    return schema(description, { ...PROJECT });
  }
  if (id === "sheets.get") {
    return schema(description, {
      ...PROJECT,
      path: {
        type: "string",
        description: "Workbook path under .glassbox-studio/sheets/ (default workbook if omit).",
      },
    });
  }
  if (id === "sheets.put") {
    return schema(
      description,
      {
        ...PROJECT,
        path: { type: "string" },
        workbook: {
          type: "object",
          description: "{ version: 1, sheets: [{ name, data }] }",
        },
      },
      ["workbook"],
    );
  }

  if (id === "data.destinations") {
    return schema(description, { ...PROJECT });
  }
  if (id === "data.tables") {
    return schema(
      description,
      {
        ...PROJECT,
        destId: { type: "string", description: "Destination id (alias: destination)." },
      },
      ["destId"],
    );
  }
  if (id === "data.rows") {
    return schema(
      description,
      {
        ...PROJECT,
        destId: { type: "string" },
        table: { type: "string" },
        limit: { type: "number" },
        offset: { type: "number" },
        sort: { type: "string" },
        dir: { type: "string", enum: ["asc", "desc"] },
        q: { type: "string", description: "Search query." },
      },
      ["destId", "table"],
    );
  }
  if (id === "data.insert") {
    return schema(
      description,
      {
        ...PROJECT,
        destId: { type: "string" },
        table: { type: "string" },
        values: { type: "object", description: "Column → value map." },
      },
      ["destId", "table", "values"],
    );
  }
  if (id === "data.update") {
    return schema(
      description,
      {
        ...PROJECT,
        destId: { type: "string" },
        table: { type: "string" },
        pk: { type: "object", description: "Primary key column → value." },
        values: { type: "object" },
      },
      ["destId", "table", "pk", "values"],
    );
  }
  if (id === "data.delete") {
    return schema(
      description,
      {
        ...PROJECT,
        destId: { type: "string" },
        table: { type: "string" },
        pk: { type: "object" },
      },
      ["destId", "table", "pk"],
    );
  }

  if (id === "notifications.list") {
    return schema(description, {
      limit: { type: "number" },
      unreadOnly: { type: "boolean" },
      source: { type: "string" },
      projectId: {
        type: "string",
        description: "Filter; empty/null = untagged only.",
      },
    });
  }
  if (id === "notifications.get") {
    return schema(
      description,
      {
        notificationId: { type: "string", description: "Alias: id." },
        id: { type: "string" },
      },
      ["notificationId"],
    );
  }
  if (id === "notifications.emit") {
    return schema(description, {
      source: { type: "string", description: "Notification source id." },
      title: { type: "string" },
      body: { type: "string" },
      severity: { type: "string" },
      projectId: { type: "string" },
      href: { type: "object" },
      envelope: {
        type: "object",
        description: "Full envelope (alt to flat fields).",
      },
    });
  }
  if (id === "notifications.markRead") {
    return schema(
      description,
      {
        ids: { type: "array", items: { type: "string" } },
        notificationId: { type: "string" },
      },
      ["ids"],
    );
  }

  if (id === "workflows.get" || id === "workflows.save") {
    return schema(
      description,
      {
        projectId: {
          type: "string",
          description: "Workspace id or _studio for Global automation.",
        },
        workflows: {
          type: "array",
          description: "Required for workflows.save — workflow entries array.",
        },
      },
      id === "workflows.save" ? ["workflows"] : undefined,
    );
  }
  if (id === "workflows.run") {
    return schema(
      description,
      {
        projectId: {
          type: "string",
          description: "Workspace id or _studio for Global automation.",
        },
        workflowId: { type: "string", description: "Workflow id in automation.json." },
        payload: { type: "object", description: "Optional envelope payload." },
        target: {
          type: "string",
          enum: ["local", "config"],
          description: 'Use local n8n base URL when "local".',
        },
      },
      ["workflowId"],
    );
  }

  if (id === "email.campaigns") {
    return schema(description, { ...PROJECT });
  }
  if (id === "email.campaignGet") {
    return schema(
      description,
      { ...PROJECT, campaignId: { type: "string" }, id: { type: "string" } },
      ["campaignId"],
    );
  }
  if (id === "email.campaignWrite") {
    return schema(
      description,
      {
        ...PROJECT,
        campaign: {
          type: "object",
          description: "Portable campaign JSON (must include id).",
        },
      },
      ["campaign"],
    );
  }
  if (id === "email.campaignSend") {
    return schema(
      description,
      {
        ...PROJECT,
        campaignId: { type: "string" },
        id: { type: "string", description: "Alias for campaignId." },
        to: {
          description: "Override recipients (string or string[]). Else campaign.audienceId.",
        },
        from: { type: "string" },
        subject: { type: "string" },
        text: { type: "string" },
        html: { type: "string" },
        vars: { type: "object" },
        dryRun: {
          type: "boolean",
          description: "Default true. Pass false to deliver.",
        },
      },
      ["campaignId"],
    );
  }

  if (id === "analytics.events") {
    return schema(description, {
      ...PROJECT,
      destination: { type: "string" },
      limit: { type: "number" },
    });
  }
  if (id === "analytics.ingest") {
    return schema(
      description,
      {
        ...PROJECT,
        name: { type: "string", description: "Event name (alias: event_name)." },
        event_name: { type: "string" },
        properties: { type: "object" },
        props: { type: "object" },
        destination: { type: "string" },
      },
      ["name"],
    );
  }
  if (id === "analytics.funnels") {
    return schema(description, { ...PROJECT });
  }
  if (id === "analytics.funnelsSet") {
    return schema(
      description,
      {
        ...PROJECT,
        funnels: {
          type: "array",
          description: "Funnel definition objects (id, title, steps, …).",
        },
      },
      ["funnels"],
    );
  }

  if (id === "ops.list") {
    return schema(description, {
      status: {
        type: "string",
        enum: ["queued", "running", "blocked", "done", "cancelled"],
      },
      projectId: { type: "string" },
    });
  }
  if (id === "ops.get" || id === "ops.cancel" || id === "ops.dismiss") {
    return schema(
      description,
      { jobId: { type: "string" }, id: { type: "string" } },
      ["jobId"],
    );
  }
  if (id === "ops.upsert") {
    return schema(
      description,
      {
        id: { type: "string" },
        title: { type: "string" },
        status: {
          type: "string",
          enum: ["queued", "running", "blocked", "done", "cancelled"],
        },
        projectId: { type: "string" },
        harnessId: { type: "string" },
        modelId: { type: "string" },
        source: { type: "string" },
        statusLine: { type: "string" },
      },
      ["id", "title"],
    );
  }

  if (id === "design.surfaces") {
    return schema(description, {});
  }
  if (id === "design.open") {
    return schema(description, {
      ds: {
        type: "string",
        enum: ["home", "system", "components", "chrome"],
        description: "Design surface (default home).",
      },
      surface: {
        type: "string",
        description: "Alias for ds.",
      },
    });
  }

  if (id === "integrations.list") {
    return schema(description, { ...PROJECT });
  }
  if (id === "integrations.write") {
    return schema(
      description,
      {
        ...PROJECT,
        id: { type: "string", description: "Integration file id (e.g. analytics)." },
        kind: { type: "string" },
        config: { type: "object" },
      },
      ["id", "config"],
    );
  }
  if (id === "integrations.delete") {
    return schema(
      description,
      { ...PROJECT, id: { type: "string" } },
      ["id"],
    );
  }

  if (id === "runtimes.list") {
    return schema(description, {});
  }

  if (
    id === "services.start" ||
    id === "services.stop" ||
    id === "services.restart"
  ) {
    return schema(
      description,
      {
        serviceId: {
          type: "string",
          description: "Studio rail service id (e.g. n8n, voice).",
        },
      },
      ["serviceId"],
    );
  }

  if (id === "convert.status" || id === "convert.presets") {
    return schema(description, {});
  }
  if (id === "convert.run") {
    return schema(
      description,
      {
        presetId: { type: "string" },
        inputPath: { type: "string", description: "Absolute path under allowed roots." },
        inputBase64: { type: "string" },
        inputFilename: { type: "string" },
        destScope: { type: "string", enum: ["studio", "project"] },
        projectId: { type: "string" },
      },
      ["presetId"],
    );
  }
  if (id === "convert.job") {
    return schema(
      description,
      { jobId: { type: "string" } },
      ["jobId"],
    );
  }

  if (id === "browser.status" || id === "browser.stop" || id === "browser.screenshot") {
    return schema(description, {});
  }
  if (id === "browser.navigate") {
    return schema(
      description,
      { url: { type: "string", description: "http(s) URL or bare host" } },
      ["url"],
    );
  }
  if (id === "browser.click") {
    return schema(
      description,
      {
        x: { type: "number" },
        y: { type: "number" },
        button: { type: "string", enum: ["left", "right", "middle"] },
        clickCount: { type: "number" },
      },
      ["x", "y"],
    );
  }
  if (id === "browser.type") {
    return schema(
      description,
      {
        text: { type: "string" },
        clear: { type: "boolean" },
      },
      ["text"],
    );
  }
  if (id === "browser.keys") {
    return schema(
      description,
      { key: { type: "string", description: "Playwright key chord" } },
      ["key"],
    );
  }

  return null;
}
