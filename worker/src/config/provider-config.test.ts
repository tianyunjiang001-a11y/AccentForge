import { describe, expect, it } from "vitest";

import { createProviderConfig } from "./provider-config";

describe("createProviderConfig", () => {
  it("uses the configured MiniMax speech speed", () => {
    const config = createProviderConfig({ MINIMAX_TTS_SPEED: "0.52" });

    expect(config.speech.speed).toBe(0.52);
  });

  it.each([undefined, "", "0.49", "2.01", "not-a-number"])(
    "falls back safely for an invalid speed value: %s",
    (value) => {
      const config = createProviderConfig({ MINIMAX_TTS_SPEED: value });

      expect(config.speech.speed).toBe(1);
    },
  );
});
