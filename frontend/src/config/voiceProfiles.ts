import type { Accent, Voice } from "../types";

export const APPROVED_VOICE_PROFILES: Readonly<
  Record<Accent, readonly Voice[]>
> = {
  British: ["Female"],
  American: ["Female", "Male"],
  Australian: ["Male"],
};

export const accentOptions = Object.keys(APPROVED_VOICE_PROFILES) as Accent[];

export const allVoiceOptions: readonly Voice[] = ["Female", "Male"];

export function voiceOptionsFor(accent: Accent | null) {
  return accent ? APPROVED_VOICE_PROFILES[accent] : allVoiceOptions;
}

export function isApprovedVoiceProfile(accent: Accent, voice: Voice) {
  return APPROVED_VOICE_PROFILES[accent].includes(voice);
}
