import { readFile } from "node:fs/promises";

const apiBaseUrl = process.env.PHASE4_API_URL ?? "http://127.0.0.1:8787";
const caseDelayMs = Number(process.env.PHASE4_CASE_DELAY_MS ?? "21000");
const casesFile = process.argv[2] ?? "./qa-cases.json";
const casesUrl = new URL(casesFile, import.meta.url);
const cases = JSON.parse(await readFile(casesUrl, "utf8"));
const results = [];

if (!Number.isFinite(caseDelayMs) || caseDelayMs < 0) {
  throw new Error("PHASE4_CASE_DELAY_MS must be a non-negative number.");
}

for (const [index, testCase] of cases.entries()) {
  if (index > 0 && caseDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, caseDelayMs));
  }

  console.error(`Running ${testCase.id} (${index + 1}/${cases.length})`);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${apiBaseUrl}/api/polish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawChinese: testCase.rawChinese,
        part: testCase.part,
        targetBand: testCase.targetBand,
      }),
    });
    const body = await response.json();

    results.push({
      ...testCase,
      status: response.status,
      durationMs: Date.now() - startedAt,
      structuredChinese:
        typeof body.structuredChinese === "string"
          ? body.structuredChinese
          : null,
      error: response.ok ? null : (body.message ?? "Unknown error"),
    });
  } catch (error) {
    results.push({
      ...testCase,
      status: null,
      durationMs: Date.now() - startedAt,
      structuredChinese: null,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const successfulCases = results.filter(
  (result) => result.status === 200 && result.structuredChinese,
).length;

console.log(
  JSON.stringify(
    {
      evaluatedAt: new Date().toISOString(),
      apiBaseUrl,
      casesFile,
      caseDelayMs,
      successfulCases,
      totalCases: results.length,
      results,
    },
    null,
    2,
  ),
);

if (successfulCases !== results.length) {
  process.exitCode = 1;
}
