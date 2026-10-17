import type { KimiProviderConfig } from "../config/provider-config";
import { ProviderError } from "./provider-error";
import { readProviderText } from "./response-reader";
import type {
  TextGenerationProvider,
  TextGenerationRequest,
  TextGenerationResult,
} from "./text-provider";

export class KimiTextProvider implements TextGenerationProvider {
  private readonly fetcher: typeof fetch;

  constructor(
    private readonly config: KimiProviderConfig,
    fetcher?: typeof fetch,
  ) {
    this.fetcher = fetcher ?? ((input, init) => globalThis.fetch(input, init));
  }

  async generateText(
    request: TextGenerationRequest,
  ): Promise<TextGenerationResult> {
    this.assertConfigured();

    const responseFormat = request.outputSchema
      ? {
          type: "json_schema",
          json_schema: {
            name: request.outputSchema.name,
            strict: true,
            schema: request.outputSchema.schema,
          },
        }
      : { type: "text" };

    let response: Response;

    try {
      response = await this.fetcher(this.chatCompletionsUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt },
          ],
          max_completion_tokens: request.maxOutputTokens,
          response_format: responseFormat,
          stream: false,
          thinking: { type: "disabled" },
        }),
        signal: AbortSignal.timeout(45_000),
      });
    } catch (error) {
      throw new ProviderError({
        code: isTimeout(error) ? "timeout" : "upstream-failure",
        operation: "text-generation",
        message: "The text provider request failed.",
        retryable: true,
      });
    }

    if (!response.ok) {
      throw new ProviderError({
        code:
          response.status === 429
            ? "upstream-rate-limited"
            : "upstream-failure",
        operation: "text-generation",
        message: "The text provider returned an error.",
        retryable: response.status === 429 || response.status >= 500,
        upstreamStatus: response.status,
      });
    }

    let responseBody: string;

    try {
      responseBody = await readProviderText(response, 128_000);
    } catch {
      throw new ProviderError({
        code: "upstream-failure",
        operation: "text-generation",
        message: "The text provider response could not be read.",
        retryable: true,
        upstreamStatus: response.status,
      });
    }

    return this.parseResponse(responseBody, response.status);
  }

  private assertConfigured() {
    if (!this.config.apiKey || !this.config.baseUrl || !this.config.model) {
      throw new ProviderError({
        code: "not-configured",
        operation: "text-generation",
        message: "The text provider is not configured.",
      });
    }

    let baseUrl: URL;

    try {
      baseUrl = new URL(this.config.baseUrl);
    } catch {
      throw new ProviderError({
        code: "not-configured",
        operation: "text-generation",
        message: "The text provider configuration is invalid.",
      });
    }

    if (baseUrl.protocol !== "https:") {
      throw new ProviderError({
        code: "not-configured",
        operation: "text-generation",
        message: "The text provider configuration is invalid.",
      });
    }
  }

  private chatCompletionsUrl() {
    return `${this.config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  }

  private parseResponse(
    responseBody: string,
    upstreamStatus: number,
  ): TextGenerationResult {
    let payload: unknown;

    try {
      payload = JSON.parse(responseBody);
    } catch {
      throw this.invalidResponseError(upstreamStatus);
    }

    if (!isKimiChatCompletion(payload)) {
      throw this.invalidResponseError(upstreamStatus);
    }

    const choice = payload.choices[0];

    if (choice.finish_reason !== "stop" || !choice.message.content.trim()) {
      throw this.invalidResponseError(upstreamStatus);
    }

    return { text: choice.message.content };
  }

  private invalidResponseError(upstreamStatus: number) {
    return new ProviderError({
      code: "invalid-response",
      operation: "text-generation",
      message: "The text provider returned an invalid response.",
      upstreamStatus,
    });
  }
}

function isTimeout(error: unknown) {
  return error instanceof Error && error.name === "TimeoutError";
}

interface KimiChatCompletion {
  choices: Array<{
    finish_reason: string;
    message: {
      content: string;
    };
  }>;
}

function isKimiChatCompletion(value: unknown): value is KimiChatCompletion {
  if (!isRecord(value) || !Array.isArray(value.choices)) {
    return false;
  }

  const firstChoice: unknown = value.choices[0];

  return (
    isRecord(firstChoice) &&
    typeof firstChoice.finish_reason === "string" &&
    isRecord(firstChoice.message) &&
    typeof firstChoice.message.content === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
