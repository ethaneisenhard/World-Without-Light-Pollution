import { describe, expect, it } from "vitest";
import type { ProjectConfig } from "./types.js";
import {
  checkRuntimeCap,
  conflictingWebServerIds,
  defaultProfileFor,
  desiredRunKey,
  isRemoteDeployedUrl,
  parseDesiredRunKey,
  parseSitesCsv,
  serversForProfile,
  webServerForProfile,
  pickRunningWebPreviewUrl,
  projectRunStatus,
  classifyRuntimeStartError,
  extractAlternateRuntimeUrlsFromLogs,
  formatRuntimeStartErrorDetail,
  materializeDevServer,
  normalizeProjectConfig,
  loopbackPreviewPort,
  resolveDevServerPort,
  workspaceRuntimeMenuFlags,
} from "./project-runtime-pure.js";

const demoConfig: ProjectConfig = {
  id: "glassbox-studio-template",
  dev: {
    defaultProfile: "minimal",
    servers: [
      {
        id: "web-node",
        kind: "web",
        url: "http://127.0.0.1:9889",
        runtime: "node",
        command: "pnpm",
        args: ["exec", "tsx", "scripts/preview-node.ts"],
        profiles: ["minimal"],
      },
      {
        id: "web-wrangler",
        kind: "web",
        url: "http://127.0.0.1:8789",
        runtime: "wrangler",
        command: "pnpm",
        args: ["exec", "wrangler", "dev", "--local", "--port", "8789"],
        profiles: ["full"],
      },
    ],
  },
};

describe("project-runtime-pure", () => {
  it("serversForProfile returns minimal node web only", () => {
    const list = serversForProfile(demoConfig, "minimal");
    expect(list.map((s) => s.id)).toEqual(["web-node"]);
  });

  it("webServerForProfile picks web kind", () => {
    expect(webServerForProfile(demoConfig, "full")?.id).toBe("web-wrangler");
    expect(defaultProfileFor(demoConfig)).toBe("minimal");
  });

  it("pickRunningWebPreviewUrl prefers web process, skips non-web sidecar", () => {
    expect(
      pickRunningWebPreviewUrl({
        processes: [
          {
            serverId: "content-hmr",
            state: "running",
            url: "http://127.0.0.1:5194",
          },
          {
            serverId: "web-wrangler",
            state: "running",
            url: "http://127.0.0.1:8789/",
          },
        ],
        servers: [
          { id: "content-hmr", kind: "hmr", url: "http://127.0.0.1:5194" },
          {
            id: "web-wrangler",
            kind: "web",
            runtime: "wrangler",
            url: "http://127.0.0.1:8789",
          },
        ],
      }),
    ).toBe("http://127.0.0.1:8789");
  });

  it("pickRunningWebPreviewUrl prefers publicUrl over loopback", () => {
    expect(
      pickRunningWebPreviewUrl({
        processes: [
          {
            serverId: "web-node",
            state: "running",
            runtime: "node",
            url: "http://127.0.0.1:9889",
            publicUrl: "https://glassbox-studio-template.preview.example.com",
          },
        ],
        servers: [
          {
            id: "web-node",
            kind: "web",
            runtime: "node",
            url: "http://127.0.0.1:9889",
          },
        ],
      }),
    ).toBe("https://glassbox-studio-template.preview.example.com");
  });

  it("pickRunningWebPreviewUrl prefers node lite over wrangler", () => {
    expect(
      pickRunningWebPreviewUrl({
        processes: [
          {
            serverId: "web-wrangler",
            state: "running",
            runtime: "wrangler",
            url: "http://127.0.0.1:8789",
          },
          {
            serverId: "web-node",
            state: "running",
            runtime: "node",
            url: "http://127.0.0.1:9889",
          },
        ],
        servers: [
          {
            id: "web-wrangler",
            kind: "web",
            runtime: "wrangler",
            url: "http://127.0.0.1:8789",
          },
          {
            id: "web-node",
            kind: "web",
            runtime: "node",
            url: "http://127.0.0.1:9889",
          },
        ],
      }),
    ).toBe("http://127.0.0.1:9889");
  });

  it("conflictingWebServerIds blocks second web on same project", () => {
    const incoming = demoConfig.dev!.servers![1]!;
    expect(
      conflictingWebServerIds(demoConfig, incoming, ["web-node"]),
    ).toEqual(["web-node"]);
  });

  it("checkRuntimeCap refuses at wrangler limit 2", () => {
    expect(checkRuntimeCap("wrangler", 1).ok).toBe(true);
    const blocked = checkRuntimeCap("wrangler", 2);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.limit).toBe(2);
      expect(blocked.runtime).toBe("wrangler");
    }
  });

  it("isRemoteDeployedUrl rejects loopback", () => {
    expect(isRemoteDeployedUrl("http://127.0.0.1:8789")).toBe(false);
    expect(isRemoteDeployedUrl("http://localhost:8789")).toBe(false);
    expect(isRemoteDeployedUrl("https://northline.example")).toBe(true);
  });

  it("desiredRunKey round-trips", () => {
    const k = desiredRunKey("demo-blog", "web-node");
    expect(parseDesiredRunKey(k)).toEqual({
      projectId: "demo-blog",
      serverId: "web-node",
    });
  });

  it("parseSitesCsv splits ids", () => {
    expect(parseSitesCsv("demo-blog, glassbox-studio-template")).toEqual([
      "demo-blog",
      "glassbox-studio-template",
    ]);
    expect(parseSitesCsv("")).toEqual([]);
  });

  it("projectRunStatus aggregates process states", () => {
    expect(projectRunStatus([])).toBe("off");
    expect(projectRunStatus([{ state: "stopped" }])).toBe("off");
    expect(projectRunStatus([{ state: "starting" }])).toBe("starting");
    expect(
      projectRunStatus([{ state: "starting" }, { state: "running" }]),
    ).toBe("running");
    expect(projectRunStatus([{ state: "error" }])).toBe("error");
    expect(
      projectRunStatus([{ state: "error" }, { state: "starting" }]),
    ).toBe("starting");
  });

  it("workspaceRuntimeMenuFlags gates run/stop/restart/open-terminal", () => {
    expect(workspaceRuntimeMenuFlags("off")).toEqual({
      canRun: true,
      canStop: false,
      canRestart: false,
      canOpenTerminal: false,
    });
    expect(workspaceRuntimeMenuFlags("running")).toEqual({
      canRun: false,
      canStop: true,
      canRestart: true,
      canOpenTerminal: true,
    });
    expect(workspaceRuntimeMenuFlags("starting")).toEqual({
      canRun: false,
      canStop: true,
      canRestart: true,
      canOpenTerminal: true,
    });
    expect(workspaceRuntimeMenuFlags("error")).toEqual({
      canRun: true,
      canStop: true,
      canRestart: true,
      canOpenTerminal: true,
    });
  });

  it("classifyRuntimeStartError detects port in use", () => {
    expect(
      classifyRuntimeStartError({
        log: ["Error: listen EADDRINUSE: address already in use :::8080\n"],
      }),
    ).toBe("port_in_use");
    expect(
      classifyRuntimeStartError({ lastError: "exited code=1" }),
    ).toBe("spawn");
  });

  it("formatRuntimeStartErrorDetail prefers real logs over [exit] marker", () => {
    const detail = formatRuntimeStartErrorDetail({
      lastError: "exited code=1 signal=null",
      log: [
        "Error: listen EADDRINUSE: address already in use :::8080\n",
        "[exit] exited code=1 signal=null",
      ],
    });
    expect(detail).toContain("EADDRINUSE");
    expect(detail).not.toMatch(/\[exit\]/);
    expect(
      formatRuntimeStartErrorDetail({
        lastError: "exited code=1 signal=null",
        log: ["[exit] exited code=1 signal=null"],
      }),
    ).toMatch(/No stdout\/stderr was captured/);
  });

  it("extractAlternateRuntimeUrlsFromLogs reads Next already-running Local URL", () => {
    expect(
      extractAlternateRuntimeUrlsFromLogs([
        "⨯ Another next dev server is already running.\n",
        "\n- Local:        http://localhost:8080\n",
        "- PID:          82120\n",
      ]),
    ).toEqual(["http://localhost:8080"]);
  });

  it("normalizeProjectConfig synthesizes web server from allowed dev.port", () => {
    const cfg = normalizeProjectConfig({
      id: "mapped-app",
      dev: { port: 9888, defaultProfile: "minimal" },
    });
    expect(cfg.dev?.servers).toHaveLength(1);
    expect(cfg.dev?.port).toBe(9888);
    expect(cfg.dev?.servers?.[0]?.url).toBe("http://localhost:9888");
    expect(serversForProfile(cfg, "minimal")).toHaveLength(1);
  });

  it("normalizeProjectConfig remaps denied host ports (e.g. 8080)", () => {
    const cfg = normalizeProjectConfig({
      id: "www-beehiiv",
      dev: { port: 8080, defaultProfile: "minimal" },
    });
    expect(cfg.dev?.port).not.toBe(8080);
    expect(cfg.dev?.port).toBeGreaterThanOrEqual(9000);
    expect(cfg.dev?.servers?.[0]?.url).toBe(
      `http://localhost:${cfg.dev?.port}`,
    );
  });

  it("normalizeProjectConfig remaps denied loopback hosting.prod_url hint", () => {
    expect(loopbackPreviewPort("http://127.0.0.1:8080")).toBe(8080);
    expect(loopbackPreviewPort("https://www.example.com")).toBeUndefined();
    const cfg = normalizeProjectConfig({
      id: "mapped-app",
      hosting: { prod_url: "http://127.0.0.1:8080" },
    });
    expect(cfg.dev?.port).not.toBe(8080);
    expect(cfg.dev?.port).toBeGreaterThanOrEqual(9000);
    expect(cfg.dev?.servers?.[0]?.url).toBe(
      `http://localhost:${cfg.dev?.port}`,
    );
  });

  it("materializeDevServer inherits dev.port and substitutes {port}", () => {
    expect(resolveDevServerPort({ kind: "web" }, { port: 8080 })).toBe(8080);
    const m = materializeDevServer(
      {
        id: "web-next",
        kind: "web",
        runtime: "node",
        command: "yarn",
        args: ["next", "dev", "--port", "{port}"],
        profiles: ["minimal"],
      },
      { port: 8080 },
    );
    expect(m.port).toBe(8080);
    expect(m.url).toBe("http://localhost:8080");
    expect(m.args).toEqual(["next", "dev", "--port", "8080"]);
  });

  it("materializeDevServer lets server.port win over url port", () => {
    const m = materializeDevServer({
      id: "web",
      kind: "web",
      port: 3000,
      url: "http://127.0.0.1:8090",
      runtime: "node",
      command: "echo",
      args: [],
      profiles: ["minimal"],
    });
    expect(m.url).toBe("http://localhost:3000");
  });

  it("classifyRuntimeStartError detects Next already running", () => {
    expect(
      classifyRuntimeStartError({
        log: ["⨯ Another next dev server is already running.\n"],
      }),
    ).toBe("port_in_use");
  });
});
