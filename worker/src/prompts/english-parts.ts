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
- When the source contains enough material, support roughly 1 minute 45 seconds to 2 minutes of natural speech without targeting an exact word count.
- Do not add biography or events to reach a duration. Structured Chinese is the story boundary.
`.trim(),
  3: `
Part 3 style:
- Sound thoughtful, analytical and conversational rather than academic.
- Express the causes, consequences, comparisons, qualifications, alternatives and broader implications already present in Structured Chinese.
- Use natural reasoning frames only when useful, such as “I'd say the main reason is”, “A lot of it comes down to”, “At the same time”, “It really depends on” or “The downside is”.
- Do not force a rigid template, formal conclusion or essay structure.
`.trim(),
};

export function getEnglishPartPrompt(part: SpeakingPart) {
  return ENGLISH_PART_PROMPTS[part];
}
