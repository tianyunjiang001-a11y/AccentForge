import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const apiBaseUrl = process.env.PHASE6B_API_URL ?? "http://127.0.0.1:8787";
const requestDelayMs = Number(process.env.PHASE6B_REQUEST_DELAY_MS ?? "3000");
const kimiDelayMs = Number(process.env.PHASE6B_KIMI_DELAY_MS ?? "21000");
const minimumWords = Number(process.env.PHASE6B_MINIMUM_WORDS ?? "350");
const casesUrl = new URL("./part2-cases.json", import.meta.url);
const resultsUrl = new URL(
  "./normal-speed-part2-results.json",
  import.meta.url,
);
const requestedCaseId = process.env.PHASE6B_CASE_ID;
const allCases = JSON.parse(await readFile(casesUrl, "utf8"));
const cases = requestedCaseId
  ? allCases.filter((testCase) => testCase.id === requestedCaseId)
  : allCases;
const outputDirectory = join(tmpdir(), "accentforge-phase6b-audio");
const results = [];

if (!Number.isFinite(requestDelayMs) || requestDelayMs < 0) {
  throw new Error("PHASE6B_REQUEST_DELAY_MS must be a non-negative number.");
}

if (!Number.isFinite(kimiDelayMs) || kimiDelayMs < 0) {
  throw new Error("PHASE6B_KIMI_DELAY_MS must be a non-negative number.");
}

if (!Number.isFinite(minimumWords) || minimumWords < 1) {
  throw new Error("PHASE6B_MINIMUM_WORDS must be a positive number.");
}

await mkdir(outputDirectory, { recursive: true });

if (cases.length === 0) {
  throw new Error(`No Phase 6B case matched ${requestedCaseId}.`);
}

const health = await fetch(`${apiBaseUrl}/health`);
if (!health.ok) {
  throw new Error(`AccentForge Worker health check failed (${health.status}).`);
}

for (const [index, testCase] of cases.entries()) {
  if (index > 0) {
    await delay(kimiDelayMs);
  }

  console.error(`Generating expanded normal-speed case ${testCase.id}`);
  const generationStartedAt = Date.now();
  const generationResponse = await fetch(`${apiBaseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredChinese: testCase.structuredChinese,
      part: testCase.part,
      targetBand: testCase.targetBand,
    }),
  });
  const generationBody = await generationResponse.json();
  const generationDurationMs = Date.now() - generationStartedAt;
  const spokenEnglish =
    typeof generationBody.spokenEnglish === "string"
      ? generationBody.spokenEnglish
      : null;

  if (!generationResponse.ok || !spokenEnglish) {
    results.push({
      ...testCase,
      generationStatus: generationResponse.status,
      generationDurationMs,
      spokenEnglish: null,
      wordCount: null,
      speechStatus: null,
      audioDurationMs: null,
      usageCharacters: null,
      audioBytes: 0,
      audioReference: null,
      error: generationBody.message ?? "English generation failed.",
    });
    continue;
  }

  const wordCount = countWords(spokenEnglish);

  if (wordCount < minimumWords) {
    results.push({
      ...testCase,
      generationStatus: generationResponse.status,
      generationDurationMs,
      spokenEnglish,
      wordCount,
      speechStatus: null,
      audioDurationMs: null,
      usageCharacters: null,
      audioBytes: 0,
      audioReference: null,
      error: `English output did not meet the ${minimumWords}-word synthesis gate.`,
    });
    continue;
  }

  await delay(requestDelayMs);
  const speechResponse = await fetch(`${apiBaseUrl}/api/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: spokenEnglish,
      accent: "australian",
      voice: "male",
    }),
  });
  const contentType = speechResponse.headers.get("content-type") ?? "";
  const filename = `normal-speed-expanded-${testCase.id}-australian-male.mp3`;

  if (!speechResponse.ok || !contentType.startsWith("audio/mpeg")) {
    results.push({
      ...testCase,
      generationStatus: generationResponse.status,
      generationDurationMs,
      spokenEnglish,
      wordCount,
      speechStatus: speechResponse.status,
      audioDurationMs: null,
      usageCharacters: null,
      audioBytes: 0,
      audioReference: null,
      error: "Speech request failed through the normalized Worker route.",
    });
    continue;
  }

  const audio = Buffer.from(await speechResponse.arrayBuffer());
  await writeFile(join(outputDirectory, filename), audio);

  results.push({
    ...testCase,
    generationStatus: generationResponse.status,
    generationDurationMs,
    spokenEnglish,
    wordCount,
    speechStatus: speechResponse.status,
    audioDurationMs: parseMetric(
      speechResponse.headers.get("x-audio-duration-ms"),
    ),
    usageCharacters: parseMetric(
      speechResponse.headers.get("x-audio-usage-characters"),
    ),
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
      textModel: "kimi-k2.6",
      speechModel: "speech-2.8-turbo",
      configuredSpeed: 1,
      outputDirectory,
      requestDelayMs,
      kimiDelayMs,
      minimumWords,
      results,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Saved normal-speed Part 2 results to ${resultsUrl.pathname}`);

if (
  results.some(
    (result) => result.generationStatus !== 200 || result.speechStatus !== 200,
  )
) {
  process.exitCode = 1;
}

function parseMetric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function countWords(value) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function delay(durationMs) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
