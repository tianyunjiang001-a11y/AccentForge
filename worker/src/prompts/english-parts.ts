import type { SpeakingPart } from "../validation/polish-request";

const ENGLISH_PART_PROMPTS: Record<SpeakingPart, string> = {
  1: `
Part 1 style:
- Be direct, personal, concise, relaxed and easy to reproduce.
- Usually follow direct answer → reason → one small detail or example.
- A natural opening such as “Yeah, definitely”, “Not really”, “I'd say so”, “Actually, I do” or “It depends, really” is allowed only when it fits.
- Do not over-explain, create a mini essay or extend the answer beyond the content in Structured Chinese.
`.trim(),
  2: `
Part 2 style:
- Sound like natural storytelling or sustained conversational description.
- Preserve the narrative sequence, emotions, details and reflection already present in Structured Chinese.
- Use clear flow, memorable but non-theatrical description and a natural closing reflection where the source contains one.
- Do not add biography, people, places, events or other substantive facts to reach a duration. Structured Chinese is the story boundary.
- Do not pad with repetition, empty commentary, hesitation fillers or generic cue-card language.
`.trim(),
  3: `
Part 3 style:
- Sound thoughtful, analytical and conversational rather than academic.
- Express the causes, consequences, comparisons, qualifications, alternatives and broader implications already present in Structured Chinese.
- Use natural reasoning frames only when useful, such as “I'd say the main reason is”, “A lot of it comes down to”, “At the same time”, “It really depends on” or “The downside is”.
- Do not force a rigid template, formal conclusion or essay structure.
`.trim(),
};

const SUSTAINED_PART_2_PROMPT = `
The supplied Structured Chinese is information-rich enough for a sustained Part 2 response:
- Develop its existing meaning fully enough to support roughly 1 minute 45 seconds to 2 minutes at AccentForge's approved normal speech speed, with about 1 minute 55 seconds as the preferred centre.
- Previous 210–280-word answers were too compressed at normal synthesis speed. Normally produce 350–390 English words. Treat this as the required calibration range; do not return a condensed summary.
- This is a Part 2 duration requirement, not a Target Band distinction. Silently plan a complete long turn before writing.
- Reach the depth by unpacking only ideas already present: explain supplied actions, sensory details, emotions, reasons, consequences, contrasts and reflections.
- Add expression, explanation and interpretation, not new scene facts. Every sentence must develop supplied content rather than restate it.
`.trim();

const LIMITED_PART_2_PROMPT = `
The supplied Structured Chinese is not information-rich enough for a two-minute answer. Preserve Semantic Lock and produce a shorter faithful answer. Do not invent or repeat content merely to hit a duration.
`.trim();

export function getEnglishPartPrompt(
  part: SpeakingPart,
  supportsSustainedPart2 = false,
) {
  const partPrompt = ENGLISH_PART_PROMPTS[part];

  if (part !== 2) {
    return partPrompt;
  }

  return `${partPrompt}\n${
    supportsSustainedPart2 ? SUSTAINED_PART_2_PROMPT : LIMITED_PART_2_PROMPT
  }`;
}
