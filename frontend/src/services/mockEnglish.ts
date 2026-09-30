import type { SpeakingPart, TargetBand } from "../types";

export const MOCK_SPOKEN_ENGLISH =
  "I generally prefer living in big cities, mainly because there are more job opportunities and everyday life tends to be more convenient. That said, city life can also be quite stressful, so I think whether it suits someone in the long run really depends on their priorities.";

interface GenerateEnglishRequest {
  part: SpeakingPart;
  structuredChinese: string;
  targetBand: TargetBand;
}

const MOCK_DELAY_MS = 320;

export async function generateMockEnglish(request: GenerateEnglishRequest) {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });
  void request;
  return MOCK_SPOKEN_ENGLISH;
}
