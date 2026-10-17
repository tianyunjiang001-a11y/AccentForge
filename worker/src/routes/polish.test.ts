import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChineseIdeaStructurer } from "../services/chinese-idea-structuring";
import { ChineseIdeaStructuringService } from "../services/chinese-idea-structuring";
import { KimiTextProvider } from "../providers/kimi-text-provider";
import { ProviderError } from "../providers/provider-error";
import { handlePolishRequest } from "./polish";

function createRequest(body: string) {
  return new Request("https://accentforge.test/api/polish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/polish", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns only the normalized browser contract", async () => {
    const structureIdea = vi.fn().mockResolvedValue({
      structuredChinese: "整理后的中文",
    });
    const service: ChineseIdeaStructurer = { structureIdea };
    const requestBody = {
      rawChinese: "原始想法",
      part: 2 as const,
      targetBand: 7 as const,
    };

    const response = await handlePolishRequest(
      createRequest(JSON.stringify(requestBody)),
      service,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      structuredChinese: "整理后的中文",
    });
    expect(structureIdea).toHaveBeenCalledWith(requestBody);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("rejects malformed input before calling the service", async () => {
    const structureIdea = vi.fn();
    const response = await handlePolishRequest(createRequest("{"), {
      structureIdea,
    });

    expect(response.status).toBe(400);
    expect(structureIdea).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("never returns provider error details", async () => {
    const response = await handlePolishRequest(
      createRequest(
        JSON.stringify({ rawChinese: "想法", part: 1, targetBand: 6 }),
      ),
      {
        structureIdea: vi
          .fn()
          .mockRejectedValue(new Error("secret provider response")),
      },
    );

    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).toContain(
      "Something went wrong while polishing your idea. Please try again.",
    );
    expect(body).not.toContain("secret provider response");
    expect(console.warn).toHaveBeenCalledExactlyOnceWith(
      "accentforge.polish_failure",
      {
        category: "unexpected-error",
        upstreamStatus: null,
        responseStatus: 502,
      },
    );
  });

  const validBody = JSON.stringify({
    rawChinese: "private learner content",
    part: 1,
    targetBand: 6,
  });
  const providerConfig = {
    apiKey: "synthetic-private-key",
    baseUrl: "https://provider.invalid/v1",
    model: "test-model",
  };

  it.each([400, 401, 403, 429, 500, 503])(
    "logs only safe metadata for upstream HTTP %i without retrying",
    async (status) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response("private upstream response", { status }),
        );
      const service = new ChineseIdeaStructuringService(
        new KimiTextProvider(providerConfig, fetcher),
      );
      const response = await handlePolishRequest(
        createRequest(validBody),
        service,
      );
      const responseStatus = status === 429 ? 503 : 502;
      expect(response.status).toBe(responseStatus);
      expect(fetcher).toHaveBeenCalledOnce();
      expect(console.warn).toHaveBeenCalledExactlyOnceWith(
        "accentforge.polish_failure",
        {
          category:
            status === 429 ? "upstream-rate-limited" : "upstream-http-failure",
          upstreamStatus: status,
          responseStatus,
        },
      );
      const body = await response.text();
      expect(body).not.toContain("private");
      expect(body).not.toContain("upstream");
      expect(body).not.toContain(String(status));
    },
  );

  it.each([
    {
      error: new TypeError("private network detail"),
      category: "upstream-transport-failure",
    },
    {
      error: new DOMException("private timeout detail", "TimeoutError"),
      category: "timeout",
    },
  ])(
    "logs $category without exception details or retries",
    async ({ error, category }) => {
      const fetcher = vi.fn<typeof fetch>().mockRejectedValue(error);
      const service = new ChineseIdeaStructuringService(
        new KimiTextProvider(providerConfig, fetcher),
      );
      const response = await handlePolishRequest(
        createRequest(validBody),
        service,
      );
      expect(response.status).toBe(502);
      expect(fetcher).toHaveBeenCalledOnce();
      expect(console.warn).toHaveBeenCalledExactlyOnceWith(
        "accentforge.polish_failure",
        {
          category,
          upstreamStatus: null,
          responseStatus: 502,
        },
      );
    },
  );

  it.each([
    { body: "not JSON: private response", category: "invalid-response" },
    {
      body: JSON.stringify({
        choices: [
          {
            finish_reason: "stop",
            message: { content: "not structured JSON: private response" },
          },
        ],
      }),
      category: "invalid-structured-output",
    },
  ])("distinguishes $category from HTTP errors", async ({ body, category }) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(body));
    const service = new ChineseIdeaStructuringService(
      new KimiTextProvider(providerConfig, fetcher),
    );
    const response = await handlePolishRequest(
      createRequest(validBody),
      service,
    );
    expect(response.status).toBe(502);
    expect(console.warn).toHaveBeenCalledExactlyOnceWith(
      "accentforge.polish_failure",
      {
        category,
        upstreamStatus: category === "invalid-response" ? 200 : null,
        responseStatus: 502,
      },
    );
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("distinguishes response-body interruption from connection failure", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new Error("private stream detail"));
          },
        }),
      ),
    );
    const response = await handlePolishRequest(
      createRequest(validBody),
      new ChineseIdeaStructuringService(
        new KimiTextProvider(providerConfig, fetcher),
      ),
    );
    expect(response.status).toBe(502);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledExactlyOnceWith(
      "accentforge.polish_failure",
      {
        category: "upstream-response-read-failure",
        upstreamStatus: 200,
        responseStatus: 502,
      },
    );
  });

  it("logs absent configuration without invoking the provider transport", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const service = new ChineseIdeaStructuringService(
      new KimiTextProvider({ ...providerConfig, apiKey: "" }, fetcher),
    );
    const response = await handlePolishRequest(
      createRequest(validBody),
      service,
    );
    expect(response.status).toBe(502);
    expect(fetcher).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledExactlyOnceWith(
      "accentforge.polish_failure",
      {
        category: "not-configured",
        upstreamStatus: null,
        responseStatus: 502,
      },
    );
  });

  it("does not log error messages, stacks, arbitrary categories or status strings", async () => {
    const error = new ProviderError({
      code: "upstream-failure",
      operation: "text-generation",
      message: "synthetic Token Cookie Secret JWT IP learner content",
    });
    Object.assign(error, {
      code: "synthetic-private-category",
      upstreamStatus: "synthetic-private-status",
      stack: "synthetic-private-stack",
    });
    const response = await handlePolishRequest(createRequest(validBody), {
      structureIdea: vi.fn().mockRejectedValue(error),
    });
    expect(response.status).toBe(502);
    expect(console.warn).toHaveBeenCalledExactlyOnceWith(
      "accentforge.polish_failure",
      {
        category: "unexpected-error",
        upstreamStatus: null,
        responseStatus: 502,
      },
    );
  });
});
