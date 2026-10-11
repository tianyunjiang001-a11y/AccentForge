import { describe, expect, it, vi } from "vitest";

import type { VoiceProfileMap } from "../config/voice-profiles";
import { MiniMaxSpeechProvider } from "./minimax-speech-provider";
import { ProviderError } from "./provider-error";

const config = {
  apiKey: "test-key",
  baseUrl: "https://api.minimax.test",
  model: "speech-2.8-turbo",
  speed: 1,
};

const voiceProfiles: VoiceProfileMap = {
  british: { female: "English_Graceful_Lady" },
  american: {
    female: "English_compelling_lady1",
    male: "English_Trustworthy_Man",
  },
  australian: { male: "English_Aussie_Bloke" },
};

const request = {
  text: "I quite like coffee because it helps me wake up.",
  accent: "australian" as const,
  voice: "male" as const,
};

function successResponse() {
  return new Response(
    JSON.stringify({
      data: { audio: "494433040000", status: 2 },
      extra_info: {
        audio_format: "mp3",
        audio_length: 2_450,
        usage_characters: 49,
      },
      base_resp: { status_code: 0, status_msg: "success" },
    }),
    { status: 200 },
  );
}

describe("MiniMaxSpeechProvider", () => {
  it("uses the documented non-streaming T2A request and decodes hex MP3", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(successResponse());
    const provider = new MiniMaxSpeechProvider(config, voiceProfiles, fetcher);

    const result = await provider.synthesizeSpeech(request);

    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.minimax.test/v1/t2a_v2");
    expect(init?.headers).toEqual({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      model: "speech-2.8-turbo",
      text: request.text,
      stream: false,
      voice_setting: {
        voice_id: "English_Aussie_Bloke",
        speed: 1,
        vol: 1,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32_000,
        bitrate: 128_000,
        format: "mp3",
        channel: 1,
      },
      language_boost: "English",
      subtitle_enable: false,
      output_format: "hex",
    });
    expect(Array.from(new Uint8Array(result.audio))).toEqual([
      0x49, 0x44, 0x33, 0x04, 0x00, 0x00,
    ]);
    expect(result).toEqual(
      expect.objectContaining({
        contentType: "audio/mpeg",
        durationMs: 2_450,
        usageCharacters: 49,
      }),
    );
  });

  it("does not duplicate the endpoint when the configured URL is complete", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(successResponse());
    const provider = new MiniMaxSpeechProvider(
      { ...config, baseUrl: "https://api.minimax.test/v1/t2a_v2" },
      voiceProfiles,
      fetcher,
    );

    await provider.synthesizeSpeech(request);

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.minimax.test/v1/t2a_v2",
      expect.any(Object),
    );
  });

  it.each([
    ["british", "female", "English_Graceful_Lady"],
    ["american", "female", "English_compelling_lady1"],
    ["american", "male", "English_Trustworthy_Man"],
    ["australian", "male", "English_Aussie_Bloke"],
  ] as const)(
    "maps %s %s to the configured candidate ID",
    async (accent, voice, expectedVoiceId) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(successResponse());
      const provider = new MiniMaxSpeechProvider(
        config,
        voiceProfiles,
        fetcher,
      );

      await provider.synthesizeSpeech({
        text: request.text,
        accent,
        voice,
      });

      const [, init] = fetcher.mock.calls[0];
      expect(JSON.parse(String(init?.body)).voice_setting.voice_id).toBe(
        expectedVoiceId,
      );
    },
  );

  it("uses the environment-configured speech speed", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(successResponse());
    const provider = new MiniMaxSpeechProvider(
      { ...config, speed: 0.52 },
      voiceProfiles,
      fetcher,
    );

    await provider.synthesizeSpeech(request);

    const [, init] = fetcher.mock.calls[0];
    expect(JSON.parse(String(init?.body)).voice_setting.speed).toBe(0.52);
  });

  it("rejects an unconfigured voice before a network request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const provider = new MiniMaxSpeechProvider(config, voiceProfiles, fetcher);

    await expect(
      provider.synthesizeSpeech({
        text: request.text,
        accent: "british",
        voice: "male",
      }),
    ).rejects.toEqual(expect.objectContaining({ code: "not-configured" }));
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("normalizes HTTP and business errors without exposing provider details", async () => {
    const httpFetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response('{"message":"private vendor detail"}', { status: 429 }),
      );
    const businessFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: null,
          base_resp: { status_code: 1004, status_msg: "secret detail" },
        }),
        { status: 200 },
      ),
    );

    const httpError = await new MiniMaxSpeechProvider(
      config,
      voiceProfiles,
      httpFetcher,
    )
      .synthesizeSpeech(request)
      .catch((error: unknown) => error);
    const businessError = await new MiniMaxSpeechProvider(
      config,
      voiceProfiles,
      businessFetcher,
    )
      .synthesizeSpeech(request)
      .catch((error: unknown) => error);

    expect(httpError).toBeInstanceOf(ProviderError);
    expect(httpError).toEqual(
      expect.objectContaining({ code: "upstream-failure", retryable: true }),
    );
    expect(String(httpError)).not.toContain("private vendor detail");
    expect(businessError).toEqual(
      expect.objectContaining({ code: "invalid-response" }),
    );
    expect(String(businessError)).not.toContain("secret detail");
  });

  it("rejects malformed, incomplete or non-MP3 successful payloads", async () => {
    const payloads = [
      "not-json",
      JSON.stringify({
        data: { audio: "not-hex", status: 2 },
        base_resp: { status_code: 0 },
      }),
      JSON.stringify({
        data: { audio: "4944", status: 1 },
        base_resp: { status_code: 0 },
      }),
      JSON.stringify({
        data: { audio: "4944", status: 2 },
        extra_info: { audio_format: "wav" },
        base_resp: { status_code: 0 },
      }),
    ];

    for (const payload of payloads) {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(payload, { status: 200 }));
      const provider = new MiniMaxSpeechProvider(
        config,
        voiceProfiles,
        fetcher,
      );

      await expect(provider.synthesizeSpeech(request)).rejects.toEqual(
        expect.objectContaining({ code: "invalid-response" }),
      );
    }
  });
});
