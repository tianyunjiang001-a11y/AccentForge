import { buildEnglishAgentPrompt } from "../prompts/english-agent";
import type { TextGenerationProvider } from "../providers/text-provider";
import type { GenerateRequest } from "../validation/generate-request";

export interface SpokenEnglishResult {
  spokenEnglish: string;
}

export interface EnglishGenerator {
  generateEnglish(request: GenerateRequest): Promise<SpokenEnglishResult>;
}

export class EnglishGenerationService implements EnglishGenerator {
  constructor(private readonly textProvider: TextGenerationProvider) {}

  async generateEnglish(
    request: GenerateRequest,
  ): Promise<SpokenEnglishResult> {
    const prompt = buildEnglishAgentPrompt(request);
    const result = await this.textProvider.generateText({
      ...prompt,
      maxOutputTokens: 2048,
      outputSchema: {
        name: "spoken_english",
        schema: {
          type: "object",
          properties: {
            spokenEnglish: {
              type: "string",
              description: "The complete natural IELTS spoken-English answer",
            },
          },
          required: ["spokenEnglish"],
          additionalProperties: false,
        },
      },
    });

    return parseSpokenEnglish(result.text);
  }
}

function parseSpokenEnglish(value: string): SpokenEnglishResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new EnglishGenerationError();
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed) ||
    typeof (parsed as Record<string, unknown>).spokenEnglish !== "string"
  ) {
    throw new EnglishGenerationError();
  }

  const spokenEnglish = (parsed as Record<string, string>).spokenEnglish.trim();

  if (!spokenEnglish) {
    throw new EnglishGenerationError();
  }

  return { spokenEnglish };
}

export class EnglishGenerationError extends Error {
  constructor() {
    super("The spoken English result is invalid.");
    this.name = "EnglishGenerationError";
  }
}
