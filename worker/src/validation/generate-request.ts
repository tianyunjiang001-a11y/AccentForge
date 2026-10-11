import type { SpeakingPart, TargetBand } from "./polish-request";
import { RequestValidationError } from "./polish-request";

export interface GenerateRequest {
  structuredChinese: string;
  part: SpeakingPart;
  targetBand: TargetBand;
}

export async function parseGenerateRequest(
  request: Request,
): Promise<GenerateRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new RequestValidationError("Please check your input and try again.");
  }

  if (!isRecord(body)) {
    throw new RequestValidationError("Please check your input and try again.");
  }

  const { structuredChinese, part, targetBand } = body;

  if (typeof structuredChinese !== "string" || !structuredChinese.trim()) {
    throw new RequestValidationError(
      "Please polish or enter your structured Chinese first.",
    );
  }

  if (Array.from(structuredChinese).length > 1000) {
    throw new RequestValidationError(
      "Please keep your structured Chinese within 1000 characters.",
    );
  }

  if (!isSpeakingPart(part) || !isTargetBand(targetBand)) {
    throw new RequestValidationError(
      "Please check your Speaking Part and Target Band.",
    );
  }

  return { structuredChinese, part, targetBand };
}

function isSpeakingPart(value: unknown): value is SpeakingPart {
  return value === 1 || value === 2 || value === 3;
}

function isTargetBand(value: unknown): value is TargetBand {
  return (
    value === 5 || value === 6 || value === 7 || value === 8 || value === 9
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
