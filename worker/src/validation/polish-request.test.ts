import { describe, expect, it } from "vitest";

import { parsePolishRequest, RequestValidationError } from "./polish-request";

function createRequest(body: BodyInit) {
  return new Request("https://accentforge.test/api/polish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("parsePolishRequest", () => {
  it("accepts a valid request", async () => {
    await expect(
      parsePolishRequest(
        createRequest(
          JSON.stringify({
            rawChinese: "我喜欢咖啡。",
            part: 1,
            targetBand: 7,
          }),
        ),
      ),
    ).resolves.toEqual({
      rawChinese: "我喜欢咖啡。",
      part: 1,
      targetBand: 7,
    });
  });

  it.each([
    ["malformed JSON", "{", "Please check your input and try again."],
    [
      "empty input",
      JSON.stringify({ rawChinese: "  ", part: 1, targetBand: 7 }),
      "Please enter your idea in Chinese.",
    ],
    [
      "over-limit Unicode input",
      JSON.stringify({
        rawChinese: "好".repeat(1001),
        part: 1,
        targetBand: 7,
      }),
      "Please keep your idea within 1000 characters.",
    ],
    [
      "unsupported part",
      JSON.stringify({ rawChinese: "想法", part: 4, targetBand: 7 }),
      "Please check your Speaking Part and Target Band.",
    ],
    [
      "unsupported band",
      JSON.stringify({ rawChinese: "想法", part: 3, targetBand: 10 }),
      "Please check your Speaking Part and Target Band.",
    ],
  ])("rejects %s", async (_label, body, message) => {
    await expect(parsePolishRequest(createRequest(body))).rejects.toMatchObject(
      {
        publicMessage: message,
      } satisfies Partial<RequestValidationError>,
    );
  });
});
