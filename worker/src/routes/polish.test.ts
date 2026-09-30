import { describe, expect, it, vi } from "vitest";

import type { ChineseIdeaStructurer } from "../services/chinese-idea-structuring";
import { handlePolishRequest } from "./polish";

function createRequest(body: string) {
  return new Request("https://accentforge.test/api/polish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/polish", () => {
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
  });

  it("rejects malformed input before calling the service", async () => {
    const structureIdea = vi.fn();
    const response = await handlePolishRequest(createRequest("{"), {
      structureIdea,
    });

    expect(response.status).toBe(400);
    expect(structureIdea).not.toHaveBeenCalled();
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
  });
});
