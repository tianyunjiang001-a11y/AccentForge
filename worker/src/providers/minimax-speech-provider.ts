import type { MiniMaxProviderConfig } from "../config/provider-config";
import type { VoiceProfileMap } from "../config/voice-profiles";
import { ProviderError } from "./provider-error";
import type {
  SpeechSynthesisProvider,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
} from "./speech-provider";

export class MiniMaxSpeechProvider implements SpeechSynthesisProvider {
  constructor(
    private readonly config: MiniMaxProviderConfig,
    private readonly voiceProfiles: VoiceProfileMap,
  ) {}

  synthesizeSpeech(
    request: SpeechSynthesisRequest,
  ): Promise<SpeechSynthesisResult> {
    void this.config;
    void this.voiceProfiles;
    void request;

    return Promise.reject(
      new ProviderError({
        code: "not-implemented",
        operation: "speech-synthesis",
        message: "Speech synthesis is not available in the mock application.",
      }),
    );
  }
}
