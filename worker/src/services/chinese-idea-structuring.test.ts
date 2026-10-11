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
    expect(request.systemPrompt).toContain("不得虚构");
    expect(request.systemPrompt).toContain("每一项个人事实都必须能追溯");
    expect(request.systemPrompt).toContain(
      "材料不足时允许答案明显短于目标时长",
    );
    expect(request.userPrompt).toContain("城市，工作多，压力，也方便。");
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
});
