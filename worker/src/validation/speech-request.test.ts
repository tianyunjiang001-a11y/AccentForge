import { describe, expect, it } from "vitest";

import {
  MAX_SPEECH_TEXT_CHARACTERS,
  parseSpeechRequest,
} from "./speech-request";

function createRequest(body: string) {
  return new Request("https://accentforge.test/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("parseSpeechRequest", () => {
  it("accepts and normalizes valid input", async () => {
    await expect(
      parseSpeechRequest(
        createRequest(
          JSON.stringify({
            text: "  Natural spoken English.  ",
            accent: "australian",
            voice: "male",
          }),
        ),
      ),
    ).resolves.toEqual({
      text: "Natural spoken English.",
      accent: "australian",
      voice: "male",
    });
  });

  it.each(["", "   "])("rejects empty text", async (text) => {
    await expect(
      parseSpeechRequest(
        createRequest(
          JSON.stringify({ text, accent: "australian", voice: "male" }),
        ),
      ),
    ).rejects.toMatchObject({ publicMessage: expect.any(String) });
  });

  it("counts Unicode code points for the provider limit", async () => {
    await expect(
      parseSpeechRequest(
        createRequest(
          JSON.stringify({
            text: "a".repeat(MAX_SPEECH_TEXT_CHARACTERS),
            accent: "australian",
            voice: "male",
          }),
        ),
      ),
    ).resolves.toBeDefined();

    await expect(
      parseSpeechRequest(
        createRequest(
          JSON.stringify({
            text: "好".repeat(MAX_SPEECH_TEXT_CHARACTERS + 1),
            accent: "australian",
            voice: "male",
          }),
        ),
      ),
    ).rejects.toMatchObject({ publicMessage: expect.any(String) });
  });

  it.each([
    { accent: "Australian", voice: "male" },
    { accent: "australian", voice: "Male" },
    { accent: "irish", voice: "male" },
    { accent: "australian", voice: "neutral" },
    { accent: "british", voice: "male" },
    { accent: "australian", voice: "female" },
    { accent: "canadian", voice: "female" },
  ])("rejects unsupported selections", async ({ accent, voice }) => {
    await expect(
      parseSpeechRequest(
        createRequest(JSON.stringify({ text: "Hello", accent, voice })),
      ),
    ).rejects.toMatchObject({ publicMessage: expect.any(String) });
  });

  it("fails safely for malformed JSON", async () => {
    await expect(parseSpeechRequest(createRequest("{"))).rejects.toMatchObject({
      publicMessage: expect.any(String),
    });
  });
});
