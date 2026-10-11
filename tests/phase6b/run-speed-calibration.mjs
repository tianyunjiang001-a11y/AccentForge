import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const apiBaseUrl = process.env.PHASE6B_API_URL ?? "http://127.0.0.1:8787";
const configuredSpeed = Number(process.env.PHASE6B_SPEED ?? "0.52");
const sourceUrl = new URL("./latest-results.json", import.meta.url);
const resultsUrl = new URL("./speed-calibration-results.json", import.meta.url);
const source = JSON.parse(await readFile(sourceUrl, "utf8"));
const outputDirectory = join(tmpdir(), "accentforge-phase6b-audio");
const results = [];

if (!Number.isFinite(configuredSpeed)) {
  throw new Error("PHASE6B_SPEED must be numeric.");
}

await mkdir(outputDirectory, { recursive: true });

for (const testCase of source.part2Results) {
  if (typeof testCase.spokenEnglish !== "string") {
    continue;
  }

  console.error(`Calibrating ${testCase.id} at speed ${configuredSpeed}`);
  const response = await fetch(`${apiBaseUrl}/api/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: testCase.spokenEnglish,
      accent: "australian",
      voice: "male",
    }),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const filename = `speed-${configuredSpeed}-${testCase.id}-australian-male.mp3`;

  if (!response.ok || !contentType.startsWith("audio/mpeg")) {
    results.push({
      id: testCase.id,
      status: response.status,
      error: "Speech request failed through the normalized Worker route.",
    });
    continue;
  }

  const audio = Buffer.from(await response.arrayBuffer());
  await writeFile(join(outputDirectory, filename), audio);

  results.push({
    id: testCase.id,
    status: response.status,
    configuredSpeed,
    wordCount: testCase.wordCount,
    previousDurationMs: testCase.audioDurationMs,
    audioDurationMs: metric(response.headers.get("x-audio-duration-ms")),
    usageCharacters: metric(response.headers.get("x-audio-usage-characters")),
    audioBytes: audio.byteLength,
    audioReference: filename,
    error: null,
  });
}

await writeFile(
  resultsUrl,
  `${JSON.stringify(
    {
      evaluatedAt: new Date().toISOString(),
      model: "speech-2.8-turbo",
      configuredSpeed,
      outputDirectory,
      kimiRequests: 0,
      results,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Saved speed calibration results to ${resultsUrl.pathname}`);

if (results.some((result) => result.status !== 200)) {
  process.exitCode = 1;
}

function metric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
