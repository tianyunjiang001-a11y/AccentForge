import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

const audioPath = process.env.PHASE6A_AUDIO_PATH;
const port = Number(process.env.PHASE6A_PLAYBACK_PORT ?? "8790");

if (!audioPath) {
  throw new Error("PHASE6A_AUDIO_PATH is required.");
}

const audio = await readFile(audioPath);
const page = `<!doctype html>
<html lang="en">
  <body data-result="pending">
    <audio controls muted src="/audio.mp3"></audio>
    <script>
      const audio = document.querySelector("audio");
      audio.addEventListener("loadedmetadata", async () => {
        try {
          await audio.play();
          document.body.dataset.result = "playing";
          document.body.dataset.duration = String(audio.duration);
          document.body.dataset.readyState = String(audio.readyState);
          fetch(
            "/result?status=playing&duration=" +
              encodeURIComponent(String(audio.duration)) +
              "&readyState=" +
              encodeURIComponent(String(audio.readyState)),
          );
        } catch {
          document.body.dataset.result = "play-error";
          fetch("/result?status=play-error");
        }
      });
      audio.addEventListener("error", () => {
        document.body.dataset.result = "media-error";
        fetch("/result?status=media-error");
      });
    </script>
  </body>
</html>`;

createServer((request, response) => {
  if (request.url?.startsWith("/result?")) {
    console.log(`Browser playback result ${request.url}`);
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.url === "/audio.mp3") {
    response.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audio.byteLength),
      "Cache-Control": "no-store",
    });
    response.end(audio);
    return;
  }

  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(page);
}).listen(port, "127.0.0.1", () => {
  console.log(`Playback fixture ready on http://127.0.0.1:${port}`);
});
