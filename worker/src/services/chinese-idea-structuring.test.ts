import { describe, expect, it, vi } from "vitest";

import type { TextGenerationProvider } from "../providers/text-provider";
import {
  ChineseIdeaStructuringError,
  ChineseIdeaStructuringService,
} from "./chinese-idea-structuring";

describe("ChineseIdeaStructuringService", () => {
  it("builds a Part- and Band-aware prompt and normalizes the result", async () => {
    const generateText = vi.fn<TextGenerationProvider["generateText"]>();
    generateText.mockResolvedValue({
      text: JSON.stringify({ structuredChinese: "  整理后的自然中文。  " }),
    });
    const service = new ChineseIdeaStructuringService({ generateText });

    await expect(
      service.structureIdea({
        rawChinese: "城市，工作多，压力，也方便。",
        part: 2,
        targetBand: 8,
      }),
    ).resolves.toEqual({ structuredChinese: "整理后的自然中文。" });

    const request = generateText.mock.calls[0][0];
    expect(request.systemPrompt).toContain("Part 2");
    expect(request.systemPrompt).toContain("Target Band 8");
    expect(request.systemPrompt).toContain("教学脚手架");
    expect(request.systemPrompt).toContain("一两个有用的细节");
    expect(request.systemPrompt).toContain("中高强度、受控的叙事补充");
    expect(request.systemPrompt).toContain("350–450 个中文字");
    expect(request.systemPrompt).toContain("严重疾病");
    expect(request.userPrompt).toContain("城市，工作多，压力，也方便。");
    expect(request.userPrompt).toContain("约 350–450 个自然中文字符");
    expect(request.outputSchema?.schema).toEqual(
      expect.objectContaining({ additionalProperties: false }),
    );
  });

  it("rejects malformed structured content", async () => {
    const textProvider: TextGenerationProvider = {
      generateText: vi.fn().mockResolvedValue({ text: "not json" }),
    };
    const service = new ChineseIdeaStructuringService(textProvider);

    await expect(
      service.structureIdea({
        rawChinese: "喜欢咖啡",
        part: 1,
        targetBand: 5,
      }),
    ).rejects.toBeInstanceOf(ChineseIdeaStructuringError);
  });

  it("deepens an information-rich Part 2 source without requesting new micro-details", async () => {
    const generateText = vi.fn<TextGenerationProvider["generateText"]>();
    generateText.mockResolvedValue({
      text: JSON.stringify({ structuredChinese: "整理后的长段中文。" }),
    });
    const service = new ChineseIdeaStructuringService({ generateText });

    await service.structureIdea({
      rawChinese: "已有明确人物、事件、细节、感受和反思的中文素材。".repeat(12),
      part: 2,
      targetBand: 7,
    });

    const request = generateText.mock.calls[0][0];
    expect(request.userPrompt).toContain("信息已经较丰富");
    expect(request.userPrompt).toContain("不要新增人物、时间、地点");
    expect(request.userPrompt).toContain("不要用重复或空话凑长度");
  });
});
