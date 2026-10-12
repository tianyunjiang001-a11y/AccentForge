import { DurableObject } from "cloudflare:workers";
import type { SecurityEnvironment } from "./types";

/** SQLite-backed singleton. Only day, provider and request counts are persisted. */
export class GlobalUsage extends DurableObject<SecurityEnvironment> {
  constructor(ctx: DurableObjectState, env: SecurityEnvironment) {
    super(ctx, env);
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS daily_usage (
        day TEXT NOT NULL,
        provider TEXT NOT NULL,
        requests INTEGER NOT NULL,
        PRIMARY KEY (day, provider)
      )
    `);
  }

  async fetch(request: Request): Promise<Response> {
    if (
      request.method !== "POST" ||
      new URL(request.url).pathname !== "/reserve"
    ) {
      return new Response(null, { status: 404 });
    }
    let value: unknown;
    try {
      value = await request.json();
    } catch {
      return new Response(null, { status: 400 });
    }
    if (!isReservation(value)) return new Response(null, { status: 400 });

    const day = new Date().toISOString().slice(0, 10);
    const sql = this.ctx.storage.sql;
    // A single SQLite statement atomically reserves a slot even with concurrent Workers.
    const reservation = sql.exec(
      `INSERT INTO daily_usage (day, provider, requests) VALUES (?, ?, 1)
       ON CONFLICT(day, provider) DO UPDATE SET requests = requests + 1
       WHERE requests < ?`,
      day,
      value.provider,
      value.limit,
    );
    const allowed = reservation.rowsWritten > 0;
    // Retain only recent operational counters, never learner content.
    sql.exec("DELETE FROM daily_usage WHERE day < ?", previousDay(day));
    return new Response(null, { status: allowed ? 200 : 429 });
  }
}

function previousDay(day: string) {
  const value = new Date(`${day}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function isReservation(
  value: unknown,
): value is { provider: "kimi" | "minimax"; limit: number } {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const entry = value as Record<string, unknown>;
  return (
    (entry.provider === "kimi" || entry.provider === "minimax") &&
    typeof entry.limit === "number" &&
    Number.isSafeInteger(entry.limit) &&
    entry.limit >= 1 &&
    entry.limit <= 100_000
  );
}
