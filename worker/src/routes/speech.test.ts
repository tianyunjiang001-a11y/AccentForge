import { describe, expect, it, vi } from "vitest";

import type { SpeechSynthesizer } from "../services/speech-synthesis";
import { UnsupportedVoiceSelectionError } from "../services/speech-synthesis";
import { handleSpeechRequest } from "./speech";

function createRequest(body: string) {
  return new Request("https://accentforge.test/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/speech", () => {
  it("returns normalized MP3 bytes and metadata", async () => {
    const synthesize = vi.fn().mockResolvedValue({
      audio: Uint8Array.from([0x49, 0x44, 0x33]).buffer,
      contentType: "audio/mpeg",
      durationMs: 2_450,
      usageCharacters: 49,
    });
    const service: SpeechSynthesizer = { synthesize };
    const requestBody = {
      text: "Natural spoken English.",
      accent: "australian" as const,
      voice: "male" as const,
    };

    const response = await handleSpeechRequest(
      createRequest(JSON.stringify(requestBody)),
      service,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-audio-duration-ms")).toBe("2450");
    expect(response.headers.get("x-audio-usage-characters")).toBe("49");
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([
      0x49, 0x44, 0x33,
    ]);
    expect(synthesize).toHaveBeenCalledWith(requestBody);
  });

  it("rejects malformed input before calling the service", async () => {
    const synthesize = vi.fn();
    const response = await handleSpeechRequest(createRequest("{"), {
      synthesize,
    });

    expect(response.status).toBe(400);
    expect(synthesize).not.toHaveBeenCalled();
  });

  it("returns a controlled message for an unsupported voice", async () => {
    const response = await handleSpeechRequest(
      createRequest(
        JSON.stringify({
          text: "Natural spoken English.",
          accent: "british",
          voice: "female",
        }),
      ),
      {
        synthesize: vi.fn(() => {
          throw new UnsupportedVoiceSelectionError();
        }),
      },
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      message:
        "This voice combination is not available yet. Please choose another accent and voice.",
    });
  });

  it("never exposes provider errors", async () => {
    const response = await handleSpeechRequest(
      createRequest(
        JSON.stringify({
          text: "Natural spoken English.",
          accent: "australian",
          voice: "male",
        }),
      ),
      {
        synthesize: vi
          .fn()
          .mockRejectedValue(new Error("secret provider response")),
      },
    );

    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).toContain("Audio could not be generated. Please try again.");
    expect(body).not.toContain("secret provider response");
  });
});
