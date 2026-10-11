import type { ProviderEnvironment } from "./provider-config";
import type { Accent, Voice } from "../providers/speech-provider";

export type VoiceProfileMap = Record<Accent, Partial<Record<Voice, string>>>;

const APPROVED_VOICE_PROFILES: Readonly<Record<Accent, readonly Voice[]>> = {
  british: ["female"],
  american: ["female", "male"],
  australian: ["male"],
};

export function createVoiceProfileMap(
  environment: ProviderEnvironment,
): VoiceProfileMap {
  return {
    british: {
      female: environment.MINIMAX_BRITISH_FEMALE_VOICE_ID ?? "",
    },
    american: {
      female: environment.MINIMAX_AMERICAN_FEMALE_VOICE_ID ?? "",
      male: environment.MINIMAX_AMERICAN_MALE_VOICE_ID ?? "",
    },
    australian: {
      male: environment.MINIMAX_AUSTRALIAN_MALE_VOICE_ID ?? "",
    },
  };
}

export function isApprovedVoiceProfile(accent: Accent, voice: Voice) {
  return APPROVED_VOICE_PROFILES[accent].includes(voice);
}
