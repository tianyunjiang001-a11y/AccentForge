import type { EnglishGenerator } from "../services/english-generation";
import { ProviderError } from "../providers/provider-error";
import { parseGenerateRequest } from "../validation/generate-request";
import { RequestValidationError } from "../validation/polish-request";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

export async function handleGenerateRequest(
  request: Request,
  service: EnglishGenerator,
): Promise<Response> {
  try {
    const input = await parseGenerateRequest(request);
    const result = await service.generateEnglish(input);

    return Response.json(result, { headers: jsonHeaders });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return Response.json(
        { message: error.publicMessage },
        { status: 400, headers: jsonHeaders },
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
      {
        message:
          "Something went wrong while generating English. Please try again.",
      },
      { status: 502, headers: jsonHeaders },
    );
  }
}
