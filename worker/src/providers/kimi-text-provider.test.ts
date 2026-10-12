import { describe, expect, it, vi } from "vitest";

import { KimiTextProvider } from "./kimi-text-provider";
import { ProviderError } from "./provider-error";

const config = {
  apiKey: "test-key",
  baseUrl: "https://api.moonshot.test/v1",
  model: "verified-model",
};

const generationRequest = {
  systemPrompt: "system rules",
  userPrompt: "learner input",
  maxOutputTokens: 2048,
  outputSchema: {
    name: "structured_chinese",
    schema: {
      type: "object",
      properties: { structuredChinese: { type: "string" } },
      required: ["structuredChinese"],
      additionalProperties: false,
    },
  },
};

describe("KimiTextProvider", () => {
  it("preserves the Worker global context for the default fetch", async () => {
    const fetcher = vi
      .fn(function (this: unknown) {
        if (this !== globalThis) {
          throw new TypeError("Illegal invocation");
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [
                {
                  finish_reason: "stop",
                  message: {
                    content: JSON.stringify({
                      structuredChinese: "整理后的中文",
                    }),
                  },
                },
              ],
            }),
            { status: 200 },
          ),
        );
      })
      .mockName("workerFetch");
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetcher as typeof fetch;

    try {
      const provider = new KimiTextProvider(config);

      await expect(provider.generateText(generationRequest)).resolves.toEqual({
        text: JSON.stringify({ structuredChinese: "整理后的中文" }),
      });
      expect(fetcher).toHaveBeenCalledOnce();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses the documented Kimi Chat Completions pattern", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: {
                content: JSON.stringify({ structuredChinese: "整理后的中文" }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const provider = new KimiTextProvider(config, fetcher);

    await expect(provider.generateText(generationRequest)).resolves.toEqual({
      text: JSON.stringify({ structuredChinese: "整理后的中文" }),
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.moonshot.test/v1/chat/completions");
    expect(init?.headers).toEqual({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      model: "verified-model",
      messages: [
        { role: "system", content: "system rules" },
        { role: "user", content: "learner input" },
      ],
      max_completion_tokens: 2048,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "structured_chinese",
          strict: true,
          schema: generationRequest.outputSchema.schema,
        },
      },
      stream: false,
      thinking: { type: "disabled" },
    });
  });

  it("normalizes provider errors without exposing the response body", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{"error":{"message":"private vendor detail"}}', {
        status: 429,
      }),
    );
    const provider = new KimiTextProvider(config, fetcher);

    const error = await provider
      .generateText(generationRequest)
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toEqual(
      expect.objectContaining({
        code: "upstream-rate-limited",
        retryable: true,
      }),
    );
    expect(String(error)).not.toContain("private vendor detail");
  });

  it("rejects truncated or malformed successful responses", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "length",
              message: { content: "{}" },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const provider = new KimiTextProvider(config, fetcher);

    await expect(provider.generateText(generationRequest)).rejects.toEqual(
      expect.objectContaining({ code: "invalid-response" }),
    );
  });

  it("normalizes timeout without retrying a chargeable request", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    const provider = new KimiTextProvider(config, fetcher);
    await expect(provider.generateText(generationRequest)).rejects.toEqual(
      expect.objectContaining({ code: "timeout" }),
    );
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
