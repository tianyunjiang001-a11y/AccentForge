import { describe, expect, it, vi } from "vitest";

import type { EnglishGenerator } from "../services/english-generation";
import { handleGenerateRequest } from "./generate";

function createRequest(body: string) {
  return new Request("https://accentforge.test/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/generate", () => {
  it("returns only the normalized browser contract", async () => {
    const generateEnglish = vi.fn().mockResolvedValue({
      spokenEnglish: "I'd say city life is more convenient.",
    });
    const service: EnglishGenerator = { generateEnglish };
    const requestBody = {
      structuredChinese: "我觉得城市生活更方便。",
      part: 3 as const,
      targetBand: 7 as const,
    };

    const response = await handleGenerateRequest(
      createRequest(JSON.stringify(requestBody)),
      service,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      spokenEnglish: "I'd say city life is more convenient.",
    });
    expect(generateEnglish).toHaveBeenCalledWith(requestBody);
  });

  it("rejects malformed input before calling the service", async () => {
    const generateEnglish = vi.fn();
    const response = await handleGenerateRequest(createRequest("{"), {
      generateEnglish,
    });

    expect(response.status).toBe(400);
    expect(generateEnglish).not.toHaveBeenCalled();
  });

  it("never returns provider error details", async () => {
    const response = await handleGenerateRequest(
      createRequest(
        JSON.stringify({
          structuredChinese: "想法",
          part: 1,
          targetBand: 6,
        }),
      ),
      {
        generateEnglish: vi
          .fn()
          .mockRejectedValue(new Error("secret provider response")),
      },
    );

    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).toContain(
      "Something went wrong while generating English. Please try again.",
    );
    expect(body).not.toContain("secret provider response");
  });
});
