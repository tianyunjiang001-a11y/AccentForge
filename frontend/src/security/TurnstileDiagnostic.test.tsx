import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TurnstileDiagnostic } from "./TurnstileDiagnostic";

type WidgetOptions = Parameters<NonNullable<Window["turnstile"]>["render"]>[1];

let options: WidgetOptions | undefined;
let widget: {
  render: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};
let fetcher: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach(() => {
  options = undefined;
  widget = {
    render: vi.fn((_element: HTMLElement, settings: WidgetOptions) => {
      options = settings;
      return "diagnostic-widget";
    }),
    execute: vi.fn(),
    reset: vi.fn(),
    remove: vi.fn(),
  };
  fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ category: "verified" }));
  vi.stubGlobal("turnstile", widget);
  vi.stubGlobal("fetch", fetcher);
});

afterEach(() => vi.unstubAllGlobals());

describe("temporary non-paid diagnostic interface", () => {
  it("uses the existing polish challenge and submits exactly one token-only POST", async () => {
    const view = render(<TurnstileDiagnostic />);
    const button = screen.getByRole("button", { name: "Verify once" });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(widget.execute).toHaveBeenCalledOnce());
    expect(options?.action).toBe("polish");
    expect(fetcher).not.toHaveBeenCalled();

    act(() => options?.callback("single-use-local-token"));
    expect(await screen.findByRole("status")).toHaveTextContent("verified");
    expect(fetcher).toHaveBeenCalledOnce();
    const [path, init] = fetcher.mock.calls[0];
    expect(path).toBe("/api/turnstile-diagnostic");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      turnstileToken: "single-use-local-token",
    });
    expect(button).toBeDisabled();
    view.unmount();
    expect(widget.remove).toHaveBeenCalledWith("diagnostic-widget");
  });

  it("does not submit after a failed challenge or show unapproved response text", async () => {
    render(<TurnstileDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Verify once" }));
    await waitFor(() => expect(widget.execute).toHaveBeenCalledOnce());
    act(() => options?.["error-callback"]());
    expect(await screen.findByRole("status")).toHaveTextContent(
      "The check could not be completed.",
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Verify once" })).toBeDisabled();
  });

  it("shows only allowlisted diagnostic categories", async () => {
    fetcher.mockResolvedValueOnce(
      Response.json({ category: "private-upstream-detail" }),
    );
    render(<TurnstileDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Verify once" }));
    await waitFor(() => expect(widget.execute).toHaveBeenCalledOnce());
    act(() => options?.callback("one-token"));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "The check could not be completed.",
    );
    expect(
      screen.queryByText(/private-upstream-detail/),
    ).not.toBeInTheDocument();
  });
});
