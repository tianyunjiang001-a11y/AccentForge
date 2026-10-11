import { describe, expect, it } from "vitest";

import { createVoiceProfileMap } from "./voice-profiles";

describe("createVoiceProfileMap", () => {
  it("keeps all eight logical slots centralized and environment-driven", () => {
    const profiles = createVoiceProfileMap({
      MINIMAX_BRITISH_FEMALE_VOICE_ID: "English_Graceful_Lady",
      MINIMAX_AMERICAN_FEMALE_VOICE_ID: "English_Whispering_girl",
      MINIMAX_AMERICAN_MALE_VOICE_ID: "English_Trustworthy_Man",
      MINIMAX_AUSTRALIAN_MALE_VOICE_ID: "English_Aussie_Bloke",
    });

    expect(profiles).toEqual({
      british: { female: "English_Graceful_Lady", male: "" },
      american: {
        female: "English_Whispering_girl",
        male: "English_Trustworthy_Man",
      },
      australian: { female: "", male: "English_Aussie_Bloke" },
      canadian: { female: "", male: "" },
    });
  });
});
