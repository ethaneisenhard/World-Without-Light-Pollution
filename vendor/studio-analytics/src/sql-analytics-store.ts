import type { SqlExecutor } from "@glassbox-studio/studio-records";
import {
  createAnalyticsEventId,
  type AnalyticsEvent,
  type AnalyticsStore,
} from "./types.js";

export function createSqlAnalyticsStore(sql: SqlExecutor): AnalyticsStore {
  return {
    async track(input) {
      const id = input.id ?? createAnalyticsEventId();
      const createdAt = Date.now();
      const props = input.props ?? {};
      await sql.run(
        `INSERT INTO analytics_events (id, name, props_json, created_at)
         VALUES (?, ?, ?, ?)`,
        [id, input.name, JSON.stringify(props), createdAt],
      );
      return { id, name: input.name, props, createdAt };
    },
    async list(opts) {
      const limit = Math.min(Math.max(opts?.limit ?? 100, 1), 5000);
      const rows = await sql.all<{
        id: string;
        name: string;
        props_json: string;
        created_at: number;
      }>(
        `SELECT id, name, props_json, created_at FROM analytics_events
         ORDER BY created_at DESC LIMIT ?`,
        [limit],
      );
      return rows.map((r): AnalyticsEvent => {
        let props: Record<string, unknown> = {};
        try {
          const p = JSON.parse(r.props_json) as unknown;
          if (p && typeof p === "object" && !Array.isArray(p)) {
            props = p as Record<string, unknown>;
          }
        } catch {
          props = {};
        }
        return {
          id: r.id,
          name: r.name,
          props,
          createdAt: Number(r.created_at),
        };
      });
    },
  };
}

export function createMemoryAnalyticsStore(): AnalyticsStore {
  const events: AnalyticsEvent[] = [];
  return {
    async track(input) {
      const ev: AnalyticsEvent = {
        id: input.id ?? createAnalyticsEventId(),
        name: input.name,
        props: input.props ?? {},
        createdAt: Date.now(),
      };
      events.push(ev);
      return ev;
    },
    async list(opts) {
      return [...events]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, opts?.limit ?? 100);
    },
  };
}
