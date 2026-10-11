import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { basename, join } from "node:path";

const audioDirectory = process.env.PHASE6B_AUDIO_DIRECTORY;
const port = Number(process.env.PHASE6B_PLAYBACK_PORT ?? "8791");

if (!audioDirectory) {
  throw new Error("PHASE6B_AUDIO_DIRECTORY is required.");
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  const filename = basename(url.searchParams.get("file") ?? "");

  if (url.pathname === "/result") {
    console.log(`Browser playback result ${url.search}`);
    response.writeHead(204);
    response.end();
    return;
  }

  if (url.pathname === "/audio" && filename.endsWith(".mp3")) {
    try {
      const audio = await readFile(join(audioDirectory, filename));
      response.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "no-store",
      });
      response.end(audio);
    } catch {
      response.writeHead(404);
      response.end();
    }
    return;
  }

  const page = `<!doctype html>
<html lang="en">
  <body data-result="pending" data-file="${escapeHtml(filename)}">
    <audio controls muted src="/audio?file=${encodeURIComponent(filename)}"></audio>
    <script>
      const audio = document.querySelector("audio");
      audio.addEventListener("loadedmetadata", async () => {
        try {
          await audio.play();
          document.body.dataset.result = "playing";
          document.body.dataset.duration = String(audio.duration);
          document.body.dataset.readyState = String(audio.readyState);
          fetch(
            "/result?file=${encodeURIComponent(filename)}&status=playing&duration=" +
              encodeURIComponent(String(audio.duration)) +
              "&readyState=" +
              encodeURIComponent(String(audio.readyState)),
          );
        } catch {
          document.body.dataset.result = "play-error";
        }
      });
      audio.addEventListener("error", () => {
        document.body.dataset.result = "media-error";
      });
    </script>
  </body>
</html>`;

  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(page);
}).listen(port, "127.0.0.1", () => {
  console.log(`Playback fixture ready on http://127.0.0.1:${port}`);
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
