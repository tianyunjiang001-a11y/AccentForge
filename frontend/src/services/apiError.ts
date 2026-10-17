export const RATE_LIMIT_MESSAGE = "Please wait a moment before trying again.";
export const DAILY_LIMIT_MESSAGE =
  "Today's availability has been reached. Please try again tomorrow.";
export const UNAVAILABLE_MESSAGE =
  "This feature is temporarily unavailable. Please try again later.";

export async function readSafeApiError(response: Response, fallback: string) {
  if (![403, 429, 503].includes(response.status)) return fallback;
  try {
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null || Array.isArray(body))
      return fallback;
    const message = (body as Record<string, unknown>).message;
    return typeof message === "string" &&
      [RATE_LIMIT_MESSAGE, DAILY_LIMIT_MESSAGE, UNAVAILABLE_MESSAGE].includes(
        message,
      )
      ? message
      : fallback;
  } catch {
    return fallback;
  }
}
