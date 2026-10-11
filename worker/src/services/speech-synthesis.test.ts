import { describe, expect, it, vi } from "vitest";

import type { VoiceProfileMap } from "../config/voice-profiles";
import type { SpeechSynthesisProvider } from "../providers/speech-provider";
import {
  SpeechSynthesisService,
  UnsupportedVoiceSelectionError,
} from "./speech-synthesis";

const voiceProfiles: VoiceProfileMap = {
  british: { female: "", male: "" },
  american: { female: "", male: "" },
  australian: { female: "", male: "English_Aussie_Bloke" },
  canadian: { female: "", male: "" },
};

describe("SpeechSynthesisService", () => {
  it("passes the configured Phase 6A selection to the provider", async () => {
    const synthesizeSpeech = vi.fn().mockResolvedValue({
      audio: new ArrayBuffer(4),
      contentType: "audio/mpeg",
    });
    const provider: SpeechSynthesisProvider = { synthesizeSpeech };
    const service = new SpeechSynthesisService(provider, voiceProfiles);
    const request = {
      text: "Natural English.",
      accent: "australian" as const,
      voice: "male" as const,
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
        voice: "female",
      }),
    ).toThrow(UnsupportedVoiceSelectionError);
    expect(synthesizeSpeech).not.toHaveBeenCalled();
  });
});
