export type Accent = "british" | "american" | "australian" | "canadian";

export type Voice = "female" | "male";

export interface SpeechSynthesisRequest {
  text: string;
  accent: Accent;
  voice: Voice;
}

export interface SpeechSynthesisResult {
  audio: ArrayBuffer;
  contentType: string;
}

export interface SpeechSynthesisProvider {
  synthesizeSpeech(
    request: SpeechSynthesisRequest,
  ): Promise<SpeechSynthesisResult>;
}
