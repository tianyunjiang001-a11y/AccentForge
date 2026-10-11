import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const apiBaseUrl = process.env.PHASE6B_API_URL ?? "http://127.0.0.1:8787";
const requestDelayMs = Number(process.env.PHASE6B_REQUEST_DELAY_MS ?? "3000");
const kimiDelayMs = Number(process.env.PHASE6B_KIMI_DELAY_MS ?? "21000");
const candidatesUrl = new URL("./voice-candidates.json", import.meta.url);
const sampleUrl = new URL("./audition-sample.txt", import.meta.url);
const part2CasesUrl = new URL("./part2-cases.json", import.meta.url);
const resultsUrl = new URL("./latest-results.json", import.meta.url);
const candidates = JSON.parse(await readFile(candidatesUrl, "utf8"));
const auditionText = (await readFile(sampleUrl, "utf8")).trim();
const part2Cases = JSON.parse(await readFile(part2CasesUrl, "utf8"));
const outputDirectory = join(tmpdir(), "accentforge-phase6b-audio");

if (!Number.isFinite(requestDelayMs) || requestDelayMs < 0) {
  throw new Error("PHASE6B_REQUEST_DELAY_MS must be a non-negative number.");
}

if (!Number.isFinite(kimiDelayMs) || kimiDelayMs < 0) {
  throw new Error("PHASE6B_KIMI_DELAY_MS must be a non-negative number.");
}

await mkdir(outputDirectory, { recursive: true });

const health = await fetch(`${apiBaseUrl}/health`);
if (!health.ok) {
  throw new Error(`AccentForge Worker health check failed (${health.status}).`);
}

const auditionResults = [];
const configuredCandidates = candidates.filter(
  (candidate) => candidate.voiceId,
);

for (const [index, candidate] of configuredCandidates.entries()) {
  if (index > 0) {
    await delay(requestDelayMs);
  }

  console.error(`Auditioning ${candidate.accent} ${candidate.voice}`);
  const result = await requestSpeech({
    text: auditionText,
    accent: candidate.accent,
    voice: candidate.voice,
  });
  const filename = `audition-${candidate.accent}-${candidate.voice}.mp3`;

  if (result.audio) {
    await writeFile(join(outputDirectory, filename), result.audio);
  }

  auditionResults.push({
    accent: candidate.accent,
    voice: candidate.voice,
    voiceId: candidate.voiceId,
    previousStatus: candidate.status,
    status: result.status,
    contentType: result.contentType,
    audioDurationMs: result.audioDurationMs,
    usageCharacters: result.usageCharacters,
    audioBytes: result.audio?.byteLength ?? 0,
    audioReference: result.audio ? filename : null,
    error: result.error,
    listeningApproval:
      candidate.status === "approved" ? "approved" : "pending human review",
  });
}

const part2Results = [];

for (const [index, testCase] of part2Cases.entries()) {
  if (index > 0) {
    await delay(kimiDelayMs);
  } else {
    await delay(requestDelayMs);
  }

  console.error(`Generating ${testCase.id}`);
  const generationStartedAt = Date.now();
  const generateResponse = await fetch(`${apiBaseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredChinese: testCase.structuredChinese,
      part: testCase.part,
      targetBand: testCase.targetBand,
    }),
  });
  const generateBody = await generateResponse.json();
  const spokenEnglish =
    typeof generateBody.spokenEnglish === "string"
      ? generateBody.spokenEnglish
      : null;

  if (!generateResponse.ok || !spokenEnglish) {
    part2Results.push({
      ...testCase,
      generationStatus: generateResponse.status,
      generationDurationMs: Date.now() - generationStartedAt,
      spokenEnglish: null,
      wordCount: null,
      speechStatus: null,
      audioDurationMs: null,
      usageCharacters: null,
      audioBytes: 0,
      audioReference: null,
      error: generateBody.message ?? "English generation failed.",
    });
    continue;
  }

  await delay(requestDelayMs);
  const speechResult = await requestSpeech({
    text: spokenEnglish,
    accent: "australian",
    voice: "male",
  });
  const filename = `${testCase.id}-australian-male.mp3`;

  if (speechResult.audio) {
    await writeFile(join(outputDirectory, filename), speechResult.audio);
  }

  part2Results.push({
    ...testCase,
    generationStatus: generateResponse.status,
    generationDurationMs: Date.now() - generationStartedAt,
    spokenEnglish,
    wordCount: countWords(spokenEnglish),
    speechStatus: speechResult.status,
    audioDurationMs: speechResult.audioDurationMs,
    usageCharacters: speechResult.usageCharacters,
    audioBytes: speechResult.audio?.byteLength ?? 0,
    audioReference: speechResult.audio ? filename : null,
    error: speechResult.error,
  });
}

const report = {
  evaluatedAt: new Date().toISOString(),
  model: "speech-2.8-turbo",
  auditionText,
  outputDirectory,
  requestDelayMs,
  kimiDelayMs,
  voiceMatrix: candidates,
  auditionResults,
  part2Results,
};

await writeFile(resultsUrl, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Saved Phase 6B results to ${resultsUrl.pathname}`);
console.log(`Audio files are in ${outputDirectory}`);

if (
  auditionResults.some((result) => result.status !== 200) ||
  part2Results.some(
    (result) => result.generationStatus !== 200 || result.speechStatus !== 200,
  )
) {
  process.exitCode = 1;
}

async function requestSpeech(input) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok) {
      return {
        status: response.status,
        contentType,
        audioDurationMs: null,
        usageCharacters: null,
        audio: null,
        error: "Speech request failed through the normalized Worker route.",
      };
    }

    return {
      status: response.status,
      contentType,
      audioDurationMs: parseMetric(response.headers.get("x-audio-duration-ms")),
      usageCharacters: parseMetric(
        response.headers.get("x-audio-usage-characters"),
      ),
      audio: Buffer.from(await response.arrayBuffer()),
      error: null,
    };
  } catch (error) {
    return {
      status: null,
      contentType: null,
      audioDurationMs: null,
      usageCharacters: null,
      audio: null,
      error: error instanceof Error ? error.message : "Unknown speech error.",
    };
  }
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
