import type { ChineseIdeaStructurer } from "../services/chinese-idea-structuring";
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

    return Response.json(
      {
        message:
          "Something went wrong while polishing your idea. Please try again.",
      },
      { status: 502, headers: jsonHeaders },
    );
  }
}
