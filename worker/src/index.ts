const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json(
        { service: "accentforge-worker", status: "ok" },
        { headers: jsonHeaders },
      );
    }

    return Response.json(
      { message: "Not found" },
      { status: 404, headers: jsonHeaders },
    );
  },
} satisfies ExportedHandler;
