import type { TargetBand } from "../validation/polish-request";

const BAND_PROMPTS: Record<TargetBand, string> = {
  5: "Target Band 5：保持思路简单、清楚、易掌握；一个主要观点、清楚原因和简单支撑细节即可。",
  6: "Target Band 6：适度展开主要观点，可增加一层解释或一个例子，但保持容易理解。",
  7: "Target Band 7：清楚、连贯地发展想法，可自然加入解释、例子、限定和逻辑推进。",
  8: "Target Band 8：提高观点的精确度与细腻程度，更自然地呈现想法之间的关系和不同角度。",
  9: "Target Band 9：在题目适合时形成高度连贯且有细微差别的推理，可自然连接多个视角并作准确限定；仍须简洁自然。",
};

export function getBandPrompt(targetBand: TargetBand) {
  return BAND_PROMPTS[targetBand];
}
