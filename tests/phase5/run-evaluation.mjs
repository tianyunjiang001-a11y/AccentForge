import { readFile, writeFile } from "node:fs/promises";

const apiBaseUrl = process.env.PHASE5_API_URL ?? "http://127.0.0.1:8787";
const caseDelayMs = Number(process.env.PHASE5_CASE_DELAY_MS ?? "21000");
const casesUrl = new URL("./qa-cases.json", import.meta.url);
const resultsFilename =
  process.env.PHASE5_RESULTS_FILE ?? "latest-results.json";
const caseFilter = process.env.PHASE5_CASE_FILTER;
const resultsUrl = new URL(`./${resultsFilename}`, import.meta.url);
const allCases = JSON.parse(await readFile(casesUrl, "utf8"));
const cases = caseFilter
  ? allCases.filter((testCase) => testCase.semanticGroup?.includes(caseFilter))
  : allCases;
const results = [];

if (!Number.isFinite(caseDelayMs) || caseDelayMs < 0) {
  throw new Error("PHASE5_CASE_DELAY_MS must be a non-negative number.");
}

if (cases.length === 0) {
  throw new Error("PHASE5_CASE_FILTER did not match any cases.");
}

for (const [index, testCase] of cases.entries()) {
  if (index > 0 && caseDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, caseDelayMs));
  }

  console.error(`Running ${testCase.id} (${index + 1}/${cases.length})`);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${apiBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredChinese: testCase.structuredChinese,
        part: testCase.part,
        targetBand: testCase.targetBand,
      }),
    });
    const body = await response.json();

    results.push({
      ...testCase,
      status: response.status,
      durationMs: Date.now() - startedAt,
      spokenEnglish:
        typeof body.spokenEnglish === "string" ? body.spokenEnglish : null,
      error: response.ok ? null : (body.message ?? "Unknown error"),
    });
  } catch (error) {
    results.push({
      ...testCase,
      status: null,
      durationMs: Date.now() - startedAt,
      spokenEnglish: null,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const successfulCases = results.filter(
  (result) => result.status === 200 && result.spokenEnglish,
).length;

const report = {
  evaluatedAt: new Date().toISOString(),
  apiBaseUrl,
  caseDelayMs,
  successfulCases,
  totalCases: results.length,
  results,
};

await writeFile(resultsUrl, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(
  `Saved ${successfulCases}/${results.length} results to ${resultsUrl.pathname}`,
);

if (successfulCases !== results.length) {
  process.exitCode = 1;
}
