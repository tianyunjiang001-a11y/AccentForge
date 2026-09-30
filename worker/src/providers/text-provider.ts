export interface TextGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface TextGenerationResult {
  text: string;
}

export interface TextGenerationProvider {
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
}
