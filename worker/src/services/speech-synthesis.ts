import type { VoiceProfileMap } from "../config/voice-profiles";
import type {
  SpeechSynthesisProvider,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
} from "../providers/speech-provider";

export const PHASE_6A_UNSUPPORTED_VOICE_MESSAGE =
  "This voice combination is not available in Phase 6A. Choose Australian · Male.";

export interface SpeechSynthesizer {
  synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResult>;
}

export class SpeechSynthesisService implements SpeechSynthesizer {
  constructor(
    private readonly provider: SpeechSynthesisProvider,
    private readonly voiceProfiles: VoiceProfileMap,
  ) {}

  synthesize(request: SpeechSynthesisRequest) {
    if (!this.voiceProfiles[request.accent][request.voice]) {
      throw new UnsupportedVoiceSelectionError();
    }

    return this.provider.synthesizeSpeech(request);
  }
}

export class UnsupportedVoiceSelectionError extends Error {
  readonly publicMessage = PHASE_6A_UNSUPPORTED_VOICE_MESSAGE;

  constructor() {
    super("The selected voice profile is not configured.");
    this.name = "UnsupportedVoiceSelectionError";
  }
}
