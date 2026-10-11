import { describe, expect, it } from "vitest";

import { createVoiceProfileMap } from "./voice-profiles";

describe("createVoiceProfileMap", () => {
  it("keeps the four approved V1 profiles centralized and environment-driven", () => {
    const profiles = createVoiceProfileMap({
      MINIMAX_BRITISH_FEMALE_VOICE_ID: "English_Graceful_Lady",
      MINIMAX_AMERICAN_FEMALE_VOICE_ID: "English_compelling_lady1",
      MINIMAX_AMERICAN_MALE_VOICE_ID: "English_Trustworthy_Man",
      MINIMAX_AUSTRALIAN_MALE_VOICE_ID: "English_Aussie_Bloke",
    });

    expect(profiles).toEqual({
      british: { female: "English_Graceful_Lady" },
      american: {
        female: "English_compelling_lady1",
        male: "English_Trustworthy_Man",
      },
      australian: { male: "English_Aussie_Bloke" },
    });
  });
});
