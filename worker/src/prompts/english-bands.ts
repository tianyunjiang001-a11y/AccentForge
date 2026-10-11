import type { TargetBand } from "../validation/polish-request";

const ENGLISH_BAND_PROMPTS: Record<TargetBand, string> = {
  5: "Target Band 5: use clear, correct, high-frequency vocabulary and mostly straightforward structures. Keep it natural, accessible and easy to reproduce without making it childish or inserting errors.",
  6: "Target Band 6: add useful vocabulary variation, some natural paraphrasing, a mixture of simple and complex structures, and moderate spoken flexibility while remaining accessible.",
  7: "Target Band 7: use flexible expression, natural collocations, effective paraphrasing, varied grammar, confident spoken rhythm and occasional idiomaticity without sounding rehearsed.",
  8: "Target Band 8: use broad and precise vocabulary, flexible grammar, natural reformulation, nuanced relationships and strong spoken coherence without becoming formal.",
  9: "Target Band 9: sound highly natural, precise, effortless, flexible and nuanced. Use idiomatic language only where it genuinely fits; simple words used extremely well are preferable to literary or academic vocabulary.",
};

export function getEnglishBandPrompt(targetBand: TargetBand) {
  return ENGLISH_BAND_PROMPTS[targetBand];
}
