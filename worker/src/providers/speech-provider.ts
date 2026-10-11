export type Accent = "british" | "american" | "australian";

export type Voice = "female" | "male";

export interface SpeechSynthesisRequest {
  text: string;
  accent: Accent;
  voice: Voice;
}

export interface SpeechSynthesisResult {
  audio: ArrayBuffer;
  contentType: string;
  durationMs?: number;
  usageCharacters?: number;
}

export interface SpeechSynthesisProvider {
  synthesizeSpeech(
    request: SpeechSynthesisRequest,
  ): Promise<SpeechSynthesisResult>;
}
