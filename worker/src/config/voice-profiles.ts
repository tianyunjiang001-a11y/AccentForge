import type { ProviderEnvironment } from "./provider-config";
import type { Accent, Voice } from "../providers/speech-provider";

export type VoiceProfileMap = Record<Accent, Record<Voice, string>>;

export function createVoiceProfileMap(
  environment: ProviderEnvironment,
): VoiceProfileMap {
  return {
    british: {
      female: environment.MINIMAX_BRITISH_FEMALE_VOICE_ID ?? "",
      male: environment.MINIMAX_BRITISH_MALE_VOICE_ID ?? "",
    },
    american: {
      female: environment.MINIMAX_AMERICAN_FEMALE_VOICE_ID ?? "",
      male: environment.MINIMAX_AMERICAN_MALE_VOICE_ID ?? "",
    },
    australian: {
      female: environment.MINIMAX_AUSTRALIAN_FEMALE_VOICE_ID ?? "",
      male: environment.MINIMAX_AUSTRALIAN_MALE_VOICE_ID ?? "",
    },
    canadian: {
      female: environment.MINIMAX_CANADIAN_FEMALE_VOICE_ID ?? "",
      male: environment.MINIMAX_CANADIAN_MALE_VOICE_ID ?? "",
    },
  };
}
