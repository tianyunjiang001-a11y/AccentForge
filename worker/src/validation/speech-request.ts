import type {
  Accent,
  SpeechSynthesisRequest,
  Voice,
} from "../providers/speech-provider";
import { isApprovedVoiceProfile } from "../config/voice-profiles";
import { RequestValidationError } from "./polish-request";

export const MAX_SPEECH_TEXT_CHARACTERS = 4_000;

const accents: readonly Accent[] = ["british", "american", "australian"];
const voices: readonly Voice[] = ["female", "male"];

export async function parseSpeechRequest(
  request: Request,
): Promise<SpeechSynthesisRequest> {
  let value: unknown;

  try {
    value = await request.json();
  } catch {
    throw invalidSpeechRequest();
  }

  if (!isRecord(value)) {
    throw invalidSpeechRequest();
  }

  const { text, accent, voice } = value;

  if (typeof text !== "string" || !text.trim()) {
    throw new RequestValidationError(
      "Please generate English before listening.",
    );
  }

  if (Array.from(text).length > MAX_SPEECH_TEXT_CHARACTERS) {
    throw new RequestValidationError(
      "The English answer is too long to read aloud.",
    );
  }

  if (
    !isAccent(accent) ||
    !isVoice(voice) ||
    !isApprovedVoiceProfile(accent, voice)
  ) {
    throw invalidSpeechRequest();
  }

  return { text: text.trim(), accent, voice };
}

function isAccent(value: unknown): value is Accent {
  return typeof value === "string" && accents.includes(value as Accent);
}

function isVoice(value: unknown): value is Voice {
  return typeof value === "string" && voices.includes(value as Voice);
}

function invalidSpeechRequest() {
  return new RequestValidationError("Please choose a valid accent and voice.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
