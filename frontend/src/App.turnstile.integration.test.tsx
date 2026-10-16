import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";

type WidgetOptions = Parameters<NonNullable<Window["turnstile"]>["render"]>[1];

let widgetOptions: WidgetOptions | undefined;
let widget: {
  render: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};
let apiFetch: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach(() => {
  widgetOptions = undefined;
  widget = {
    render: vi.fn((_container: HTMLElement, options: WidgetOptions) => {
      widgetOptions = options;
      return "polish-widget";
    }),
    execute: vi.fn(),
    reset: vi.fn(),
    remove: vi.fn(),
  };
  apiFetch = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      structuredChinese: "我喜欢在家休息，因为工作日比较累。",
    }),
  );
  vi.stubGlobal("turnstile", widget);
  vi.stubGlobal("fetch", apiFetch);
});

afterEach(() => vi.unstubAllGlobals());

async function preparePolish() {
  const user = userEvent.setup();
  const view = render(<App />);
  await user.click(screen.getByRole("button", { name: "Part 1" }));
  await user.click(screen.getByRole("button", { name: "6" }));
  await user.type(
    screen.getByLabelText("What I Want to Say"),
    "周末喜欢在家休息",
  );
  return view;
}

describe("real Turnstile hook to Polish POST handoff", () => {
  it("submits exactly once after a successful callback without a second click", async () => {
    const view = await preparePolish();
    const button = screen.getByRole("button", { name: "Polish My Idea" });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(widget.execute).toHaveBeenCalledOnce());
    expect(widget.render).toHaveBeenCalledOnce();
    expect(widget.reset).toHaveBeenCalledOnce();
    expect(widgetOptions?.action).toBe("polish");
    expect(apiFetch).not.toHaveBeenCalled();

    act(() => widgetOptions?.callback("test-polish-token"));
    await screen.findByDisplayValue("我喜欢在家休息，因为工作日比较累。");

    expect(apiFetch).toHaveBeenCalledOnce();
    expect(apiFetch.mock.calls[0][0]).toBe("/api/polish");
    const request = apiFetch.mock.calls[0][1];
    expect(request?.method).toBe("POST");
    expect(JSON.parse(String(request?.body))).toEqual({
      rawChinese: "周末喜欢在家休息",
      part: 1,
      targetBand: 6,
      turnstileToken: "test-polish-token",
    });

    view.unmount();
    expect(widget.remove).toHaveBeenCalledWith("polish-widget");
  });

  it("recovers from challenge failure and timeout without sending a POST", async () => {
    await preparePolish();
    fireEvent.click(screen.getByRole("button", { name: "Polish My Idea" }));
    await waitFor(() => expect(widget.execute).toHaveBeenCalledTimes(1));
    act(() => widgetOptions?.["error-callback"]());
    expect(
      await screen.findByText(
        "Please complete the security check and try again.",
      ),
    ).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Polish My Idea" }),
      ).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Polish My Idea" }));
    await waitFor(() => expect(widget.execute).toHaveBeenCalledTimes(2));
    act(() => widgetOptions?.["timeout-callback"]());
    expect(apiFetch).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Polish My Idea" }),
      ).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Polish My Idea" }));
    await waitFor(() => expect(widget.execute).toHaveBeenCalledTimes(3));
    act(() => widgetOptions?.callback("fresh-test-token"));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledOnce());
    expect(widget.reset).toHaveBeenCalledTimes(3);
  });

  it.each([
    [403, "Please complete the security check and try again."],
    [503, "This feature is temporarily unavailable. Please try again later."],
  ])(
    "shows the restrained Worker %i response after one POST",
    async (status, message) => {
      apiFetch.mockResolvedValueOnce(Response.json({ message }, { status }));
      await preparePolish();
      fireEvent.click(screen.getByRole("button", { name: "Polish My Idea" }));
      await waitFor(() => expect(widget.execute).toHaveBeenCalledOnce());
      act(() => widgetOptions?.callback("test-polish-token"));

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(apiFetch).toHaveBeenCalledOnce();
    },
  );
});
