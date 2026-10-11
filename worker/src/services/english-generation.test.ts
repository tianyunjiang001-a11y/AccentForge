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

  it("calibrates information-rich Part 2 for normal-speed sustained speech", async () => {
    const generateText = vi.fn<TextGenerationProvider["generateText"]>();
    generateText.mockResolvedValue({
      text: JSON.stringify({ spokenEnglish: "A sustained natural response." }),
    });
    const service = new EnglishGenerationService({ generateText });

    await expect(
      service.generateEnglish({
        structuredChinese:
          "这是一段信息丰富、包含细节、感受和反思的第二部分素材。".repeat(30),
        part: 2,
        targetBand: 7,
      }),
    ).resolves.toEqual({
      spokenEnglish: "A sustained natural response.",
    });

    const request = generateText.mock.calls[0][0];
    expect(request.systemPrompt).toContain("approved normal speech speed");
    expect(request.systemPrompt).toContain(
      "Normally produce 350–390 English words",
    );
    expect(request.systemPrompt).toContain("required calibration range");
    expect(request.systemPrompt).toContain("Do not add biography");
    expect(request.systemPrompt).toContain("Do not pad with repetition");
    expect(request.userPrompt).toContain("Produce 350–390 English words");
    expect(request.userPrompt).toContain("Do not summarize it");
    expect(request.userPrompt).toContain("Do not add plausible micro-details");
    expect(request.outputSchema?.name).toBe("spoken_english");
  });

  it("keeps a short edited Part 2 source faithful instead of padding it", async () => {
    const generateText = vi.fn<TextGenerationProvider["generateText"]>();
    generateText.mockResolvedValue({
      text: JSON.stringify({ spokenEnglish: "A short faithful response." }),
    });
    const service = new EnglishGenerationService({ generateText });

    await expect(
      service.generateEnglish({
        structuredChinese: "用户删减后的简短第二部分内容。",
        part: 2,
        targetBand: 7,
      }),
    ).resolves.toEqual({ spokenEnglish: "A short faithful response." });

    const request = generateText.mock.calls[0][0];
    expect(request.systemPrompt).toContain("not information-rich enough");
    expect(request.userPrompt).not.toContain("Produce 350–390 English words");
    expect(request.outputSchema?.name).toBe("spoken_english");
  });
});
