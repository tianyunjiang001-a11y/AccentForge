import { parseGenerateRequest } from "../validation/generate-request";
import {
  parsePolishRequest,
  RequestValidationError,
} from "../validation/polish-request";
import { parseSpeechRequest } from "../validation/speech-request";
import { safeJson } from "./response";
import type { PaidRoute } from "./types";

const MAX_BODY_BYTES: Record<PaidRoute, number> = {
  polish: 8_192,
  generate: 8_192,
  speech: 24_000,
};

export type RequestCheck =
  { token: string; error?: never } | { error: Response; token?: never };

export async function checkPaidRequest(
  request: Request,
  route: PaidRoute,
): Promise<RequestCheck> {
  if (request.method !== "POST") {
    return { error: safeJson("This request is not supported.", 405) };
  }

  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return { error: safeJson("Please check your input and try again.", 415) };
  }

  const limit = MAX_BODY_BYTES[route];
  const declaredSize = Number(request.headers.get("content-length"));
  if (declaredSize > limit) {
    return { error: safeJson("Your request is too large.", 413) };
  }

  let body: unknown;
  try {
    const bytes = await readLimitedBody(request.clone(), limit);
    body = JSON.parse(
      new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes),
    );
  } catch (error) {
    return {
      error: safeJson(
        error instanceof BodyTooLargeError
          ? "Your request is too large."
          : "Please check your input and try again.",
        error instanceof BodyTooLargeError ? 413 : 400,
      ),
    };
  }

  if (!isRecord(body)) {
    return { error: safeJson("Please check your input and try again.", 400) };
  }

  try {
    const validatedRequest = new Request(request.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (route === "polish") await parsePolishRequest(validatedRequest);
    if (route === "generate") await parseGenerateRequest(validatedRequest);
    if (route === "speech") await parseSpeechRequest(validatedRequest);
  } catch (error) {
    return {
      error: safeJson(
        error instanceof RequestValidationError
          ? error.publicMessage
          : "Please check your input and try again.",
        400,
      ),
    };
  }

  if (
    typeof body.turnstileToken !== "string" ||
    !body.turnstileToken.trim() ||
    body.turnstileToken.length > 2048
  ) {
    return {
      error: safeJson("Please complete the security check and try again.", 403),
    };
  }

  return { token: body.turnstileToken };
}

async function readLimitedBody(request: Request, limit: number) {
  if (!request.body) throw new Error("Empty body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        void reader.cancel();
        throw new BodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

class BodyTooLargeError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
