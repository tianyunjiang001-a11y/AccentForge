import type { SpeakingPart, TargetBand } from "../types";

export const MOCK_STRUCTURED_CHINESE =
  "我比较喜欢住在大城市，主要是因为工作机会更多，而且生活通常也更方便。不过，大城市的生活节奏比较快，压力也会更明显，所以我觉得是否适合长期生活还是要看个人选择。";

export const MOCK_SPOKEN_ENGLISH =
  "I generally prefer living in big cities, mainly because there are more job opportunities and everyday life tends to be more convenient. That said, city life can also be quite stressful, so I think whether it suits someone in the long run really depends on their priorities.";

interface PolishRequest {
  part: SpeakingPart;
  rawChinese: string;
  targetBand: TargetBand;
}

interface GenerateEnglishRequest {
  part: SpeakingPart;
  structuredChinese: string;
  targetBand: TargetBand;
}

const MOCK_DELAY_MS = 320;

function waitForMockResponse() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });
}

export async function polishMockIdea(request: PolishRequest) {
  await waitForMockResponse();
  void request;
  return MOCK_STRUCTURED_CHINESE;
}

export async function generateMockEnglish(request: GenerateEnglishRequest) {
  await waitForMockResponse();
  void request;
  return MOCK_SPOKEN_ENGLISH;
}
