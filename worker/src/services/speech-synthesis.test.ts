import { describe, expect, it, vi } from "vitest";

import type { VoiceProfileMap } from "../config/voice-profiles";
import type { SpeechSynthesisProvider } from "../providers/speech-provider";
import {
  SpeechSynthesisService,
  UnsupportedVoiceSelectionError,
} from "./speech-synthesis";

const voiceProfiles: VoiceProfileMap = {
  british: { female: "English_Graceful_Lady" },
  american: {
    female: "English_compelling_lady1",
    male: "English_Trustworthy_Man",
  },
  australian: { male: "English_Aussie_Bloke" },
};

describe("SpeechSynthesisService", () => {
  it("passes a configured Phase 6B selection to the provider", async () => {
    const synthesizeSpeech = vi.fn().mockResolvedValue({
      audio: new ArrayBuffer(4),
      contentType: "audio/mpeg",
    });
    const provider: SpeechSynthesisProvider = { synthesizeSpeech };
    const service = new SpeechSynthesisService(provider, voiceProfiles);
    const request = {
      text: "Natural English.",
      accent: "british" as const,
      voice: "female" as const,
    };

    await expect(service.synthesize(request)).resolves.toEqual(
      expect.objectContaining({ contentType: "audio/mpeg" }),
    );
    expect(synthesizeSpeech).toHaveBeenCalledWith(request);
  });

  it("rejects unsupported combinations before calling the provider", () => {
    const synthesizeSpeech = vi.fn();
    const service = new SpeechSynthesisService(
      { synthesizeSpeech },
      voiceProfiles,
    );

    expect(() =>
      service.synthesize({
        text: "Natural English.",
        accent: "british",
        voice: "male",
      }),
    ).toThrow(UnsupportedVoiceSelectionError);
    expect(synthesizeSpeech).not.toHaveBeenCalled();
  });
});
