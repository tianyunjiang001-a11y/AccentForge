import type { SpeakingPart, TargetBand } from "../types";

export const POLISH_ERROR_MESSAGE =
  "Something went wrong while polishing your idea. Please try again.";

interface PolishIdeaRequest {
  part: SpeakingPart;
  rawChinese: string;
  targetBand: TargetBand;
}

interface PolishIdeaResponse {
  structuredChinese: string;
}

export async function polishIdea(request: PolishIdeaRequest): Promise<string> {
  let response: Response;

  try {
    response = await fetch("/api/polish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rawChinese: request.rawChinese,
        part: Number(request.part.replace("Part ", "")),
        targetBand: Number(request.targetBand),
      }),
    });
  } catch {
    throw new PolishIdeaError();
  }

  if (!response.ok) {
    throw new PolishIdeaError();
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new PolishIdeaError();
  }

  if (!isPolishIdeaResponse(body)) {
    throw new PolishIdeaError();
  }

  return body.structuredChinese;
}

class PolishIdeaError extends Error {
  constructor() {
    super(POLISH_ERROR_MESSAGE);
    this.name = "PolishIdeaError";
  }
}

function isPolishIdeaResponse(value: unknown): value is PolishIdeaResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).structuredChinese === "string" &&
    Boolean((value as Record<string, string>).structuredChinese.trim())
  );
}
