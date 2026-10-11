import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";

const KIMI_STRUCTURED_CHINESE =
  "我比较喜欢住在大城市，主要是因为工作机会更多，而且生活通常也更方便。不过，大城市的生活节奏比较快，压力也会更明显，所以我觉得是否适合长期生活还是要看个人选择。";
const KIMI_SPOKEN_ENGLISH =
  "I'd say I prefer living in a big city because there are more job opportunities and everyday life is generally more convenient. Having said that, the pace can be stressful, so whether it works in the long run really depends on the person.";

const apiFetch = vi.fn();

beforeEach(() => {
  apiFetch.mockImplementation(async (input: RequestInfo | URL) => {
    if (String(input) === "/api/polish") {
      return {
        ok: true,
        json: async () => ({ structuredChinese: KIMI_STRUCTURED_CHINESE }),
      };
    }

    if (String(input) === "/api/generate") {
      return {
        ok: true,
        json: async () => ({ spokenEnglish: KIMI_SPOKEN_ENGLISH }),
      };
    }

    return { ok: false };
  });
  vi.stubGlobal("fetch", apiFetch);
});

afterEach(() => {
  apiFetch.mockReset();
  vi.unstubAllGlobals();
});

async function buildEnglishAnswer() {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: "Part 3" }));
  await user.click(screen.getByRole("button", { name: "7" }));
  await user.type(
    screen.getByLabelText("What I Want to Say"),
    "我喜欢大城市，工作机会多，但是压力也很大。",
  );
  await user.click(screen.getByRole("button", { name: "Polish My Idea" }));
  await screen.findByDisplayValue(KIMI_STRUCTURED_CHINESE);
  await user.click(screen.getByRole("button", { name: "Generate English" }));
  await screen.findByDisplayValue(KIMI_SPOKEN_ENGLISH);

  return user;
}

describe("AccentForge Phase 5 workflow", () => {
  it("uses real polish and generate endpoints while audio remains mocked", async () => {
    const user = await buildEnglishAnswer();

    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/polish",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          rawChinese: "我喜欢大城市，工作机会多，但是压力也很大。",
          part: 3,
          targetBand: 7,
        }),
      }),
    );
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          structuredChinese: KIMI_STRUCTURED_CHINESE,
          part: 3,
          targetBand: 7,
        }),
      }),
    );

    await user.click(screen.getByRole("button", { name: "British" }));
    await user.click(screen.getByRole("button", { name: "Female" }));

    expect(document.querySelector("audio")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Read Aloud" }));

    expect(document.querySelector("audio")).toBeInTheDocument();
    expect(screen.getByText("British · Female")).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("marks both generated stages stale when Target Band changes", async () => {
    const user = await buildEnglishAnswer();

    await user.click(screen.getByRole("button", { name: "8" }));

    expect(screen.getAllByText("Update needed")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Generate English" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Read Aloud" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Polish My Idea" }),
    ).toBeEnabled();
  });

  it("marks both generated stages stale when Speaking Part changes", async () => {
    const user = await buildEnglishAnswer();

    await user.click(screen.getByRole("button", { name: "Part 2" }));

    expect(screen.getAllByText("Update needed")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Generate English" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Read Aloud" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Polish My Idea" }),
    ).toBeEnabled();
  });

  it("marks only English stale when structured Chinese is edited", async () => {
    await buildEnglishAnswer();
    const chineseEditor = screen.getByLabelText("What I Want to Say");

    fireEvent.change(chineseEditor, {
      target: { value: `${KIMI_STRUCTURED_CHINESE} 我更看重机会。` },
    });

    expect(screen.getAllByText("Update needed")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Generate English" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Read Aloud" })).toBeDisabled();
  });

  it("keeps Chinese and English unchanged when voice settings change", async () => {
    const user = await buildEnglishAnswer();

    await user.click(screen.getByRole("button", { name: "Australian" }));
    await user.click(screen.getByRole("button", { name: "Male" }));
    await user.click(screen.getByRole("button", { name: "Read Aloud" }));
    expect(document.querySelector("audio")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Female" }));

    expect(screen.getByLabelText("What I Want to Say")).toHaveValue(
      KIMI_STRUCTURED_CHINESE,
    );
    expect(screen.getByLabelText("IELTS Speaking Version")).toHaveValue(
      KIMI_SPOKEN_ENGLISH,
    );
    expect(screen.queryByText("Update needed")).not.toBeInTheDocument();
    expect(document.querySelector("audio")).not.toBeInTheDocument();
  });

  it("limits the idea to 1000 Unicode characters", async () => {
    render(<App />);
    const chineseEditor = screen.getByLabelText("What I Want to Say");

    fireEvent.change(chineseEditor, {
      target: { value: "好".repeat(1001) },
    });

    await waitFor(() => {
      expect(
        Array.from((chineseEditor as HTMLTextAreaElement).value),
      ).toHaveLength(1000);
    });
    expect(screen.getByText("1000 / 1000")).toBeInTheDocument();
  });

  it("shows a restrained error when polishing fails", async () => {
    apiFetch.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Part 1" }));
    await user.click(screen.getByRole("button", { name: "6" }));
    await user.type(screen.getByLabelText("What I Want to Say"), "喜欢咖啡");
    await user.click(screen.getByRole("button", { name: "Polish My Idea" }));

    expect(
      await screen.findByText(
        "Something went wrong while polishing your idea. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("What I Want to Say")).toHaveValue("喜欢咖啡");
  });

  it("generates from the latest learner-edited Structured Chinese", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Part 2" }));
    await user.click(screen.getByRole("button", { name: "8" }));
    await user.type(screen.getByLabelText("What I Want to Say"), "旧相机");
    await user.click(screen.getByRole("button", { name: "Polish My Idea" }));
    await screen.findByDisplayValue(KIMI_STRUCTURED_CHINESE);

    const latestChinese = "这是我编辑后的旧相机故事，已经删除了原来的人物。";
    await user.clear(screen.getByLabelText("What I Want to Say"));
    await user.type(screen.getByLabelText("What I Want to Say"), latestChinese);
    await user.click(screen.getByRole("button", { name: "Generate English" }));
    await screen.findByDisplayValue(KIMI_SPOKEN_ENGLISH);

    expect(apiFetch).toHaveBeenLastCalledWith(
      "/api/generate",
      expect.objectContaining({
        body: JSON.stringify({
          structuredChinese: latestChinese,
          part: 2,
          targetBand: 8,
        }),
      }),
    );
  });

  it("shows a restrained error when English generation fails", async () => {
    apiFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ structuredChinese: KIMI_STRUCTURED_CHINESE }),
      })
      .mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Part 1" }));
    await user.click(screen.getByRole("button", { name: "6" }));
    await user.type(screen.getByLabelText("What I Want to Say"), "喜欢咖啡");
    await user.click(screen.getByRole("button", { name: "Polish My Idea" }));
    await screen.findByDisplayValue(KIMI_STRUCTURED_CHINESE);
    await user.click(screen.getByRole("button", { name: "Generate English" }));

    expect(
      await screen.findByText(
        "Something went wrong while generating English. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read Aloud" })).toBeDisabled();
  });
});
