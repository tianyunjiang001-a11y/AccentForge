import type { ChineseIdeaStructurer } from "../services/chinese-idea-structuring";
import { ChineseIdeaStructuringError } from "../services/chinese-idea-structuring";
import { ProviderError } from "../providers/provider-error";
import {
  parsePolishRequest,
  RequestValidationError,
} from "../validation/polish-request";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

export async function handlePolishRequest(
  request: Request,
  service: ChineseIdeaStructurer,
): Promise<Response> {
  try {
    const input = await parsePolishRequest(request);
    const result = await service.structureIdea(input);

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
      logPolishFailure(error, 503);
      return Response.json(
        {
          message:
            "This feature is temporarily unavailable. Please try again later.",
        },
        { status: 503, headers: jsonHeaders },
      );
    }

    logPolishFailure(error, 502);
    return Response.json(
      {
        message:
          "Something went wrong while polishing your idea. Please try again.",
      },
      { status: 502, headers: jsonHeaders },
    );
  }
}

// Never serialize the error, request or upstream response. Only fixed categories
// and numeric HTTP statuses belong in operational logs, not in browser errors.
function logPolishFailure(error: unknown, responseStatus: number) {
  let category = "unexpected-error";
  let upstreamStatus: number | null = null;
  if (error instanceof ChineseIdeaStructuringError) {
    category = "invalid-structured-output";
  } else if (error instanceof ProviderError) {
    switch (error.code) {
      case "not-configured":
      case "not-implemented":
      case "upstream-failure":
      case "upstream-rate-limited":
      case "timeout":
      case "invalid-response":
        category = error.code;
    }
    const status = error.upstreamStatus;
    if (
      typeof status === "number" &&
      Number.isInteger(status) &&
      status >= 100 &&
      status <= 599
    ) {
      upstreamStatus = status;
    }
    if (error.code === "upstream-failure") {
      category =
        upstreamStatus === null
          ? "upstream-transport-failure"
          : upstreamStatus >= 200 && upstreamStatus < 300
            ? "upstream-response-read-failure"
            : "upstream-http-failure";
    }
  }
  console.warn("accentforge.polish_failure", {
    category,
    upstreamStatus,
    responseStatus,
  });
}
