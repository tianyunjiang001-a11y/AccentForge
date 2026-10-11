import { describe, expect, it, vi } from "vitest";

import type { TextGenerationProvider } from "../providers/text-provider";
import {
  EnglishGenerationError,
  EnglishGenerationService,
} from "./english-generation";

describe("EnglishGenerationService", () => {
  it("uses the latest Chinese with Semantic Lock and normalizes English", async () => {
    const generateText = vi.fn<TextGenerationProvider["generateText"]>();
    generateText.mockResolvedValue({
      text: JSON.stringify({ spokenEnglish: "  I'd say it's worth it.  " }),
    });
    const service = new EnglishGenerationService({ generateText });

    await expect(
      service.generateEnglish({
        structuredChinese: "这是用户修改后的内容，已经删除了原来的旅行细节。",
        part: 3,
        targetBand: 9,
      }),
    ).resolves.toEqual({ spokenEnglish: "I'd say it's worth it." });

    const request = generateText.mock.calls[0][0];
    expect(request.systemPrompt).toContain("SEMANTIC LOCK");
    expect(request.systemPrompt).toContain("Do not add any new substantive");
    expect(request.systemPrompt).toContain("Part 3 style");
    expect(request.systemPrompt).toContain("Target Band 9");
    expect(request.systemPrompt).toContain("never insert um, uh, erm");
    expect(request.userPrompt).toContain("用户修改后的内容");
    expect(request.outputSchema?.schema).toEqual(
      expect.objectContaining({ additionalProperties: false }),
    );
  });

  it("rejects malformed structured content", async () => {
    const textProvider: TextGenerationProvider = {
      generateText: vi.fn().mockResolvedValue({ text: "not json" }),
    };
    const service = new EnglishGenerationService(textProvider);

    await expect(
      service.generateEnglish({
        structuredChinese: "最新中文",
        part: 1,
        targetBand: 5,
      }),
    ).rejects.toBeInstanceOf(EnglishGenerationError);
  });
});
