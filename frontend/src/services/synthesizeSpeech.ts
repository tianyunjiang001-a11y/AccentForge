import type { Accent, Voice } from "../types";
import { readSafeApiError } from "./apiError";

export const AUDIO_ERROR_MESSAGE =
  "Audio could not be generated. Please try again.";
export const UNSUPPORTED_VOICE_MESSAGE =
  "This voice combination is not available yet. Please choose another accent and voice.";

interface SynthesizeSpeechInput {
  text: string;
  accent: Accent;
  voice: Voice;
}

export interface SynthesizedAudio {
  audioUrl: string;
  durationMs: number | null;
  usageCharacters: number | null;
}

export async function synthesizeSpeech(
  input: SynthesizeSpeechInput,
): Promise<SynthesizedAudio> {
  let response: Response;

  try {
    response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input.text,
        accent: input.accent.toLowerCase(),
        voice: input.voice.toLowerCase(),
      }),
    });
  } catch {
    throw new Error(AUDIO_ERROR_MESSAGE);
  }

  if (response.status === 422) {
    throw new Error(UNSUPPORTED_VOICE_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(await readSafeApiError(response, AUDIO_ERROR_MESSAGE));
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("audio/mpeg")) {
    throw new Error(AUDIO_ERROR_MESSAGE);
  }

  const audio = await response.blob();

  if (audio.size === 0) {
    throw new Error(AUDIO_ERROR_MESSAGE);
  }

  return {
    audioUrl: URL.createObjectURL(audio),
    durationMs: parseMetric(response.headers.get("x-audio-duration-ms")),
    usageCharacters: parseMetric(
      response.headers.get("x-audio-usage-characters"),
    ),
  };
}

function parseMetric(value: string | null) {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
