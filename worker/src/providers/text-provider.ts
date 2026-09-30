export interface TextOutputSchema {
  name: string;
  schema: Record<string, unknown>;
}

export interface TextGenerationRequest {
  maxOutputTokens?: number;
  outputSchema?: TextOutputSchema;
  systemPrompt: string;
  userPrompt: string;
}

export interface TextGenerationResult {
  text: string;
}

export interface TextGenerationProvider {
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
}
