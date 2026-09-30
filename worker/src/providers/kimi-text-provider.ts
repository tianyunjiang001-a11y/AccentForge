import type { KimiProviderConfig } from "../config/provider-config";
import { ProviderError } from "./provider-error";
import type {
  TextGenerationProvider,
  TextGenerationRequest,
  TextGenerationResult,
} from "./text-provider";

export class KimiTextProvider implements TextGenerationProvider {
  constructor(private readonly config: KimiProviderConfig) {}

  generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    void this.config;
    void request;

    return Promise.reject(
      new ProviderError({
        code: "not-implemented",
        operation: "text-generation",
        message: "Text generation is not available in the mock application.",
      }),
    );
  }
}
