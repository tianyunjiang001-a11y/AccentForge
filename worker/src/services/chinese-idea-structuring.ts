import { buildChineseAgentPrompt } from "../prompts/chinese-agent";
import type { TextGenerationProvider } from "../providers/text-provider";
import type { PolishRequest } from "../validation/polish-request";

export interface StructuredChineseResult {
  structuredChinese: string;
}

export interface ChineseIdeaStructurer {
  structureIdea(request: PolishRequest): Promise<StructuredChineseResult>;
}

export class ChineseIdeaStructuringService implements ChineseIdeaStructurer {
  constructor(private readonly textProvider: TextGenerationProvider) {}

  async structureIdea(
    request: PolishRequest,
  ): Promise<StructuredChineseResult> {
    const prompt = buildChineseAgentPrompt(request);
    const result = await this.textProvider.generateText({
      ...prompt,
      maxOutputTokens: 2048,
      outputSchema: {
        name: "structured_chinese",
        schema: {
          type: "object",
          properties: {
            structuredChinese: {
              type: "string",
              description: "整理后的自然中文口语答案",
            },
          },
          required: ["structuredChinese"],
          additionalProperties: false,
        },
      },
    });

    return parseStructuredChinese(result.text);
  }
}

function parseStructuredChinese(value: string): StructuredChineseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new ChineseIdeaStructuringError();
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed) ||
    typeof (parsed as Record<string, unknown>).structuredChinese !== "string"
  ) {
    throw new ChineseIdeaStructuringError();
  }

  const structuredChinese = (
    parsed as Record<string, string>
  ).structuredChinese.trim();

  if (!structuredChinese) {
    throw new ChineseIdeaStructuringError();
  }

  return { structuredChinese };
}

export class ChineseIdeaStructuringError extends Error {
  constructor() {
    super("The structured Chinese result is invalid.");
    this.name = "ChineseIdeaStructuringError";
  }
}
