import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8",
  );
}

test("Pages Functions invoke only API paths", () => {
  const routes = JSON.parse(read("frontend/public/_routes.json"));
  assert.deepEqual(routes, {
    version: 1,
    include: ["/api/*"],
    exclude: [],
  });
});

test("Worker first-deployment switches and production origin fail closed", () => {
  const config = read("worker/wrangler.toml");
  const lines = config.split(/\r?\n/);
  for (const [key, value] of Object.entries({
    name: '"accentforge-worker"',
    workers_dev: "false",
    SECURITY_ENV: '"production"',
    API_ENABLED: '"false"',
    KIMI_ENABLED: '"false"',
    MINIMAX_ENABLED: '"false"',
    ALLOWED_ORIGINS: '"https://accentforge.pages.dev"',
    TURNSTILE_ALLOWED_HOSTNAMES: '"accentforge.pages.dev"',
  })) {
    assert.ok(lines.includes(`${key} = ${value}`), `${key} must be ${value}`);
  }
  assert.equal((config.match(/^\[\[ratelimits\]\]$/gm) ?? []).length, 4);
  assert.match(config, /^new_sqlite_classes = \["GlobalUsage"\]$/m);
});

test("Pages package manager and build path match the workspace", () => {
  const root = JSON.parse(read("package.json"));
  const frontend = JSON.parse(read("frontend/package.json"));
  assert.equal(root.packageManager, "pnpm@11.19.0");
  assert.equal(frontend.name, "@accentforge/frontend");
  assert.equal(frontend.scripts.build, "tsc -b && vite build");
  assert.match(read("pnpm-lock.yaml"), /^lockfileVersion: '9\.0'$/m);
});
