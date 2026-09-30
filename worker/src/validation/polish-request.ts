export type SpeakingPart = 1 | 2 | 3;
export type TargetBand = 5 | 6 | 7 | 8 | 9;

export interface PolishRequest {
  rawChinese: string;
  part: SpeakingPart;
  targetBand: TargetBand;
}

export class RequestValidationError extends Error {
  constructor(readonly publicMessage: string) {
    super(publicMessage);
    this.name = "RequestValidationError";
  }
}

export async function parsePolishRequest(
  request: Request,
): Promise<PolishRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new RequestValidationError("Please check your input and try again.");
  }

  if (!isRecord(body)) {
    throw new RequestValidationError("Please check your input and try again.");
  }

  const { rawChinese, part, targetBand } = body;

  if (typeof rawChinese !== "string" || !rawChinese.trim()) {
    throw new RequestValidationError("Please enter your idea in Chinese.");
  }

  if (Array.from(rawChinese).length > 1000) {
    throw new RequestValidationError(
      "Please keep your idea within 1000 characters.",
    );
  }

  if (!isSpeakingPart(part) || !isTargetBand(targetBand)) {
    throw new RequestValidationError(
      "Please check your Speaking Part and Target Band.",
    );
  }

  return { rawChinese, part, targetBand };
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
