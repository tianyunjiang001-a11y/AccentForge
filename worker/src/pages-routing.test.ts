import { describe, expect, it, vi } from "vitest";

import { onRequest } from "../../functions/api/[[path]]";
import { app } from "./app";

const productionOrigin = "https://accentforge.pages.dev";

function request(path: string, origin = productionOrigin, method = "POST") {
  return new Request(`${origin}${path}`, {
    method,
    headers: {
      origin: productionOrigin,
      "content-type": "application/json",
      "cf-connecting-ip": "192.0.2.10",
    },
    body: method === "POST" ? JSON.stringify({ sample: "test" }) : undefined,
  });
}

describe("Pages API forwarding", () => {
  it.each(["/api/polish", "/api/generate", "/api/speech"])(
    "forwards only the original %s request and response",
    async (path) => {
      const incoming = request(`${path}?source=test`);
      const expected = new Response("worker response", {
        status: 202,
        headers: { "cache-control": "no-store, private" },
      });
      const fetch = vi.fn().mockResolvedValue(expected);
      const response = await onRequest({
        request: incoming,
        env: { ACCENTFORGE_API: { fetch } },
      });

      expect(fetch).toHaveBeenCalledExactlyOnceWith(incoming);
      expect(response).toBe(expected);
      expect(incoming.method).toBe("POST");
      expect(new URL(incoming.url).search).toBe("?source=test");
      expect(incoming.headers.get("origin")).toBe(productionOrigin);
      expect(incoming.headers.get("cf-connecting-ip")).toBe("192.0.2.10");
      expect(await incoming.text()).toBe('{"sample":"test"}');
    },
  );

  it("forwards a supported preflight to the protected Worker", async () => {
    const incoming = request("/api/polish", productionOrigin, "OPTIONS");
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const response = await onRequest({
      request: incoming,
      env: { ACCENTFORGE_API: { fetch } },
    });
    expect(response.status).toBe(204);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(incoming);
  });

  it.each(["POST", "GET", "OPTIONS"])(
    "rejects the removed diagnostic endpoint for %s in Pages and Worker",
    async (method) => {
      const fetch = vi.fn();
      const response = await onRequest({
        request: request("/api/turnstile-diagnostic", productionOrigin, method),
        env: { ACCENTFORGE_API: { fetch } },
      });
      expect(response.status).toBe(404);
      expect(fetch).not.toHaveBeenCalled();

      const workerResponse = await app.fetch(
        request("/api/turnstile-diagnostic", productionOrigin, method),
        {},
      );
      expect(workerResponse.status).toBe(404);
      expect(await workerResponse.json()).toEqual({ message: "Not found" });
    },
  );

  it.each(["/api/unknown", "/api/polish/extra", "/api/speech/"])(
    "rejects unsupported path %s without invoking the binding",
    async (path) => {
      const fetch = vi.fn();
      const response = await onRequest({
        request: request(path),
        env: { ACCENTFORGE_API: { fetch } },
      });
      expect(response.status).toBe(404);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("rejects an unsupported method before invoking the binding", async () => {
    const fetch = vi.fn();
    const response = await onRequest({
      request: request("/api/generate", productionOrigin, "GET"),
      env: { ACCENTFORGE_API: { fetch } },
    });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST, OPTIONS");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    "https://other.example",
    "https://preview.accentforge.pages.dev",
    "https://main.accentforge.pages.dev",
    "http://accentforge.pages.dev",
  ])("rejects non-production origin %s", async (origin) => {
    const fetch = vi.fn();
    const response = await onRequest({
      request: request("/api/polish", origin),
      env: { ACCENTFORGE_API: { fetch } },
    });
    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails closed when the Service Binding is missing", async () => {
    const response = await onRequest({
      request: request("/api/polish"),
      env: {},
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(await response.json()).toEqual({
      message: "This feature is temporarily unavailable.",
    });
  });

  it("normalizes a Service Binding failure without leaking details", async () => {
    const response = await onRequest({
      request: request("/api/speech"),
      env: {
        ACCENTFORGE_API: {
          fetch: vi.fn().mockRejectedValue(new Error("internal target detail")),
        },
      },
    });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("internal target detail");
  });

  it.each(["/api/polish", "/api/generate", "/api/speech"])(
    "keeps %s disabled through the Service Binding on first deployment",
    async (path) => {
      const response = await onRequest({
        request: request(path),
        env: {
          ACCENTFORGE_API: {
            fetch: (incoming) =>
              app.fetch(incoming, {
                API_ENABLED: "false",
                KIMI_ENABLED: "false",
                MINIMAX_ENABLED: "false",
              }),
          },
        },
      });
      expect(response.status).toBe(503);
      expect(await response.text()).toContain("temporarily unavailable");
    },
  );
});
