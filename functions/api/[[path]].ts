// Pages project root is the repository root; only /api/* invokes this Function.
const PRODUCTION_ORIGIN = "https://accentforge.pages.dev";
const APPROVED_PATHS = new Set(["/api/polish", "/api/generate", "/api/speech"]);

interface ApiServiceBinding {
  fetch(request: Request): Promise<Response>;
}

interface Context {
  request: Request;
  env: { ACCENTFORGE_API?: ApiServiceBinding };
}

function reject(
  message: string,
  status: number,
  headers?: Record<string, string>,
) {
  return Response.json(
    { message },
    {
      status,
      headers: {
        "cache-control": "no-store, private",
        "x-content-type-options": "nosniff",
        ...headers,
      },
    },
  );
}

export async function onRequest({ request, env }: Context): Promise<Response> {
  const url = new URL(request.url);
  if (url.origin !== PRODUCTION_ORIGIN) {
    return reject("This request is not supported.", 403);
  }
  if (!APPROVED_PATHS.has(url.pathname)) {
    return reject("Not found.", 404);
  }
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    return reject("This method is not supported.", 405, {
      allow: "POST, OPTIONS",
    });
  }
  if (!env.ACCENTFORGE_API) {
    return reject("This feature is temporarily unavailable.", 503);
  }

  try {
    // The original Request preserves method, URL, query, body, Origin and
    // Cloudflare request metadata for the Worker's existing security chain.
    return await env.ACCENTFORGE_API.fetch(request);
  } catch {
    return reject("This feature is temporarily unavailable.", 503);
  }
}
