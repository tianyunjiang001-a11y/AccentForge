import type { SpeakingPart, TargetBand } from "../types";
import { readSafeApiError } from "./apiError";

export const GENERATE_ENGLISH_ERROR_MESSAGE =
  "Something went wrong while generating English. Please try again.";

interface GenerateEnglishRequest {
  part: SpeakingPart;
  structuredChinese: string;
  targetBand: TargetBand;
}

interface GenerateEnglishResponse {
  spokenEnglish: string;
}

export async function generateEnglish(
  request: GenerateEnglishRequest,
): Promise<string> {
  let response: Response;

  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        structuredChinese: request.structuredChinese,
        part: Number(request.part.replace("Part ", "")),
        targetBand: Number(request.targetBand),
      }),
    });
  } catch {
    throw new GenerateEnglishError();
  }

  if (!response.ok) {
    throw new GenerateEnglishError(
      await readSafeApiError(response, GENERATE_ENGLISH_ERROR_MESSAGE),
    );
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new GenerateEnglishError();
  }

  if (!isGenerateEnglishResponse(body)) {
    throw new GenerateEnglishError();
  }

  return body.spokenEnglish;
}

class GenerateEnglishError extends Error {
  constructor(message = GENERATE_ENGLISH_ERROR_MESSAGE) {
    super(message);
    this.name = "GenerateEnglishError";
  }
}

function isGenerateEnglishResponse(
  value: unknown,
): value is GenerateEnglishResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).spokenEnglish === "string" &&
    Boolean((value as Record<string, string>).spokenEnglish.trim())
  );
}
