import { describe, expect, it } from "vitest";

import { parseGenerateRequest } from "./generate-request";
import { RequestValidationError } from "./polish-request";

function createRequest(body: BodyInit) {
  return new Request("https://accentforge.test/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("parseGenerateRequest", () => {
  it("accepts the latest structured Chinese", async () => {
    await expect(
      parseGenerateRequest(
        createRequest(
          JSON.stringify({
            structuredChinese: "这是学习者编辑后的最新中文。",
            part: 2,
            targetBand: 7,
          }),
        ),
      ),
    ).resolves.toEqual({
      structuredChinese: "这是学习者编辑后的最新中文。",
      part: 2,
      targetBand: 7,
    });
  });

  it.each([
    ["malformed JSON", "{", "Please check your input and try again."],
    [
      "empty input",
      JSON.stringify({ structuredChinese: "  ", part: 1, targetBand: 7 }),
      "Please polish or enter your structured Chinese first.",
    ],
    [
      "over-limit Unicode input",
      JSON.stringify({
        structuredChinese: "好".repeat(1001),
        part: 2,
        targetBand: 7,
      }),
      "Please keep your structured Chinese within 1000 characters.",
    ],
    [
      "unsupported part",
      JSON.stringify({ structuredChinese: "想法", part: 4, targetBand: 7 }),
      "Please check your Speaking Part and Target Band.",
    ],
    [
      "unsupported band",
      JSON.stringify({ structuredChinese: "想法", part: 3, targetBand: 10 }),
      "Please check your Speaking Part and Target Band.",
    ],
  ])("rejects %s", async (_label, body, message) => {
    await expect(
      parseGenerateRequest(createRequest(body)),
    ).rejects.toMatchObject({
      publicMessage: message,
    } satisfies Partial<RequestValidationError>);
  });
});
