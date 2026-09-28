import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "./App";
import {
  MOCK_SPOKEN_ENGLISH,
  MOCK_STRUCTURED_CHINESE,
} from "./services/mockWorkflow";

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
  await screen.findByDisplayValue(MOCK_STRUCTURED_CHINESE);
  await user.click(screen.getByRole("button", { name: "Generate English" }));
  await screen.findByDisplayValue(MOCK_SPOKEN_ENGLISH);

  return user;
}

describe("AccentForge mock workflow", () => {
  it("completes the full deterministic flow and creates audio on demand", async () => {
    const user = await buildEnglishAnswer();

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
      target: { value: `${MOCK_STRUCTURED_CHINESE} 我更看重机会。` },
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
      MOCK_STRUCTURED_CHINESE,
    );
    expect(screen.getByLabelText("IELTS Speaking Version")).toHaveValue(
      MOCK_SPOKEN_ENGLISH,
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
});
