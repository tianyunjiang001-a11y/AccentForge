import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createTestHarness } from "wrangler";

// Actual local workerd + SQLite, isolated from .dev.vars and production storage.
// This test calls only the existing Durable Object binding, never a provider.
test(
  "SQLite global quotas allow only 4 Kimi and 2 MiniMax concurrent reservations",
  { timeout: 60_000 },
  async () => {
    const server = createTestHarness({
      root: fileURLToPath(new URL("./", import.meta.url)),
      workers: [
        {
          config: {
            name: "accentforge-quota-offline-test",
            main: fileURLToPath(new URL("../src/index.ts", import.meta.url)),
            compatibility_date: "2026-09-28",
            workers_dev: false,
            preview_urls: false,
            vars: {
              SECURITY_ENV: "production",
              API_ENABLED: "false",
              KIMI_ENABLED: "false",
              MINIMAX_ENABLED: "false",
              KIMI_DAILY_REQUEST_LIMIT: "4",
              MINIMAX_DAILY_REQUEST_LIMIT: "2",
            },
            durable_objects: {
              bindings: [{ name: "GLOBAL_USAGE", class_name: "GlobalUsage" }],
            },
            migrations: [
              {
                tag: "local-quota-test-v1",
                new_sqlite_classes: ["GlobalUsage"],
              },
            ],
          },
        },
      ],
    });
    try {
      await server.listen();
      const worker = server.getWorker();
      const env = await worker.getEnv();
      assert.ok(
        !Object.hasOwn(env, "KIMI_API_KEY"),
        "must not load local Kimi credentials",
      );
      assert.ok(
        !Object.hasOwn(env, "MINIMAX_API_KEY"),
        "must not load local MiniMax credentials",
      );
      const objectName = "accentforge-global-usage";
      const stub = env.GLOBAL_USAGE.get(
        env.GLOBAL_USAGE.idFromName(objectName),
      );
      const reserve = (provider, limit) =>
        stub.fetch("https://quota.internal/reserve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ provider, limit }),
        });

      const outcomes = await Promise.all(
        Array.from({ length: 64 }, async (_, i) => {
          const provider = i % 2 === 0 ? "kimi" : "minimax";
          const response = await reserve(provider, provider === "kimi" ? 4 : 2);
          return { provider, status: response.status };
        }),
      );
      for (const [provider, limit] of [
        ["kimi", 4],
        ["minimax", 2],
      ]) {
        const responses = outcomes.filter(
          (outcome) => outcome.provider === provider,
        );
        assert.equal(
          responses.filter(({ status }) => status === 200).length,
          limit,
        );
        assert.equal(
          responses.filter(({ status }) => status === 429).length,
          32 - limit,
        );
        assert.equal((await reserve(provider, limit)).status, 429);
      }

      const storage = await worker.getDurableObjectStorage("GLOBAL_USAGE", {
        name: objectName,
      });
      const rows = await storage.exec(
        "SELECT provider, requests FROM daily_usage ORDER BY provider",
      );
      assert.deepEqual(rows, [
        { provider: "kimi", requests: 4 },
        { provider: "minimax", requests: 2 },
      ]);
      await worker.evictDurableObject("GLOBAL_USAGE", { name: objectName });
      assert.equal((await reserve("kimi", 4)).status, 429);
      assert.equal((await reserve("minimax", 2)).status, 429);
      console.log(
        "Local SQLite: 64 concurrent attempts; Kimi 4/32 and MiniMax 2/32 admitted; exhaustion survives eviction.",
      );
    } finally {
      await server.close();
    }
  },
);
