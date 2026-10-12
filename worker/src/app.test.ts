import { afterEach, describe, expect, it, vi } from "vitest";

import { app } from "./app";
import type { SecurityEnvironment } from "./security/types";

const rate = { limit: async () => ({ success: true }) };

function environment(): SecurityEnvironment {
  return {
    KIMI_API_KEY: "unit-only-kimi-key",
    KIMI_BASE_URL: "https://kimi.unit.test/v1",
    KIMI_TEXT_MODEL: "unit-model",
    MINIMAX_API_KEY: "unit-only-minimax-key",
    MINIMAX_BASE_URL: "https://minimax.unit.test",
    MINIMAX_TTS_MODEL: "speech-2.8-turbo",
    MINIMAX_AUSTRALIAN_MALE_VOICE_ID: "English_Aussie_Bloke",
    TURNSTILE_SITE_KEY: "unit-public-key",
    TURNSTILE_SECRET_KEY: "unit-server-secret",
    TURNSTILE_ALLOWED_HOSTNAMES: "app.example",
    ALLOWED_ORIGINS: "https://app.example",
    POLISH_RATE_LIMIT: rate,
    GENERATE_RATE_LIMIT: rate,
    SPEECH_RATE_LIMIT: rate,
    COMBINED_RATE_LIMIT: rate,
    GLOBAL_USAGE: {
      idFromName: () => "global-id",
      get: () => ({ fetch: async () => new Response(null, { status: 200 }) }),
    } as unknown as DurableObjectNamespace,
  };
}

function request(route: string, body: unknown) {
  return new Request(`https://worker.example/api/${route}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://app.example",
    },
    body: JSON.stringify({
      ...(body as object),
      turnstileToken: `unit-token-${route}`,
    }),
  });
}

function fakeProviderFetch(
  options: {
    siteverify?: boolean;
    kimiStatus?: number;
    miniMaxStatus?: number;
  } = {},
) {
  return vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes("turnstile/v0/siteverify")) {
      const token = new URLSearchParams(String(init?.body)).get("response");
      return Response.json({
        success:
          options.siteverify !== false && token?.startsWith("unit-token-"),
        hostname: "app.example",
        action: token?.replace("unit-token-", ""),
      });
    }
    if (url.includes("kimi.unit.test")) {
      if (options.kimiStatus)
        return new Response("private provider error", {
          status: options.kimiStatus,
        });
      const payload = JSON.parse(String(init?.body));
      const field =
        payload.response_format.json_schema.name === "structured_chinese"
          ? { structuredChinese: "我喜欢咖啡，因为味道很好。" }
          : { spokenEnglish: "I like coffee because it tastes good." };
      return Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: { content: JSON.stringify(field) },
          },
        ],
      });
    }
    if (url.includes("minimax.unit.test")) {
      if (options.miniMaxStatus)
        return new Response("private provider error", {
          status: options.miniMaxStatus,
        });
      return Response.json({
        data: { audio: "494433040000", status: 2 },
        base_resp: { status_code: 0 },
        extra_info: { audio_format: "mp3" },
      });
    }
    throw new Error(`Unexpected external request in test: ${url}`);
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("secured Worker route integration with mocked providers", () => {
  it("keeps the complete Polish, Generate and Speech contracts working", async () => {
    const fetcher = fakeProviderFetch();
    vi.stubGlobal("fetch", fetcher);
    const env = environment();
    const polish = await app.fetch(
      request("polish", { rawChinese: "我喜欢咖啡", part: 1, targetBand: 6 }),
      env,
    );
    const generate = await app.fetch(
      request("generate", {
        structuredChinese: "我喜欢咖啡，因为味道很好。",
        part: 1,
        targetBand: 6,
      }),
      env,
    );
    const speech = await app.fetch(
      request("speech", {
        text: "I like coffee because it tastes good.",
        accent: "australian",
        voice: "male",
      }),
      env,
    );
    expect(polish.status).toBe(200);
    await expect(polish.json()).resolves.toEqual({
      structuredChinese: "我喜欢咖啡，因为味道很好。",
    });
    expect(generate.status).toBe(200);
    await expect(generate.json()).resolves.toEqual({
      spokenEnglish: "I like coffee because it tastes good.",
    });
    expect(speech.status).toBe(200);
    expect(speech.headers.get("content-type")).toBe("audio/mpeg");
    expect(
      fetcher.mock.calls.filter(([url]) =>
        String(url).includes("turnstile/v0/siteverify"),
      ),
    ).toHaveLength(3);
    expect(
      fetcher.mock.calls.filter(([url]) =>
        String(url).includes("kimi.unit.test"),
      ),
    ).toHaveLength(2);
    expect(
      fetcher.mock.calls.filter(([url]) =>
        String(url).includes("minimax.unit.test"),
      ),
    ).toHaveLength(1);
  });

  it("makes no paid provider request after a failed security check", async () => {
    const fetcher = fakeProviderFetch({ siteverify: false });
    vi.stubGlobal("fetch", fetcher);
    const response = await app.fetch(
      request("polish", { rawChinese: "咖啡", part: 1, targetBand: 6 }),
      environment(),
    );
    expect(response.status).toBe(403);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(String(fetcher.mock.calls[0][0])).toContain(
      "turnstile/v0/siteverify",
    );
  });

  it("hides upstream 429 and MiniMax errors from the browser", async () => {
    const kimiFetch = fakeProviderFetch({ kimiStatus: 429 });
    vi.stubGlobal("fetch", kimiFetch);
    const kimi = await app.fetch(
      request("generate", {
        structuredChinese: "咖啡",
        part: 1,
        targetBand: 6,
      }),
      environment(),
    );
    expect(kimi.status).toBe(503);
    expect(await kimi.text()).not.toContain("private provider error");

    const speechFetch = fakeProviderFetch({ miniMaxStatus: 503 });
    vi.stubGlobal("fetch", speechFetch);
    const speech = await app.fetch(
      request("speech", {
        text: "Good morning.",
        accent: "australian",
        voice: "male",
      }),
      environment(),
    );
    expect(speech.status).toBe(502);
    expect(await speech.text()).not.toContain("private provider error");
  });
});
