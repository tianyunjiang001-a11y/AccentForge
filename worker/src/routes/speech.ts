import type { SpeechSynthesizer } from "../services/speech-synthesis";
import { ProviderError } from "../providers/provider-error";
import { UnsupportedVoiceSelectionError } from "../services/speech-synthesis";
import { RequestValidationError } from "../validation/polish-request";
import { parseSpeechRequest } from "../validation/speech-request";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

export async function handleSpeechRequest(
  request: Request,
  service: SpeechSynthesizer,
): Promise<Response> {
  try {
    const input = await parseSpeechRequest(request);
    const result = await service.synthesize(input);
    const headers = new Headers({
      "cache-control": "no-store",
      "content-length": String(result.audio.byteLength),
      "content-type": result.contentType,
    });

    if (result.durationMs !== undefined) {
      headers.set("x-audio-duration-ms", String(result.durationMs));
    }

    if (result.usageCharacters !== undefined) {
      headers.set("x-audio-usage-characters", String(result.usageCharacters));
    }

    return new Response(result.audio, { headers });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return Response.json(
        { message: error.publicMessage },
        { status: 400, headers: jsonHeaders },
      );
    }

    if (error instanceof UnsupportedVoiceSelectionError) {
      return Response.json(
        { message: error.publicMessage },
        { status: 422, headers: jsonHeaders },
      );
    }

    if (
      error instanceof ProviderError &&
      error.code === "upstream-rate-limited"
    ) {
      return Response.json(
        {
          message:
            "This feature is temporarily unavailable. Please try again later.",
        },
        { status: 503, headers: jsonHeaders },
      );
    }

    return Response.json(
      { message: "Audio could not be generated. Please try again." },
      { status: 502, headers: jsonHeaders },
    );
  }
}
