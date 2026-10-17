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
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "HTTP 200 — verified",
      ),
    );
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

  it("identifies token acquisition failure before POST", async () => {
    render(<TurnstileDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Verify once" }));
    await waitFor(() => expect(widget.execute).toHaveBeenCalledOnce());
    act(() => options?.["error-callback"]());
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Token acquisition failed before POST.",
      ),
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Verify once" })).toBeDisabled();
  });

  it("identifies POST network failure without exposing transport details", async () => {
    fetcher.mockRejectedValueOnce(new Error("private transport detail"));
    render(<TurnstileDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Verify once" }));
    await waitFor(() => expect(widget.execute).toHaveBeenCalledOnce());
    act(() => options?.callback("one-token"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "POST network failure.",
      ),
    );
    expect(fetcher).toHaveBeenCalledOnce();
    expect(
      screen.queryByText(/private transport detail/),
    ).not.toBeInTheDocument();
  });

  it("preserves HTTP status when JSON parsing fails", async () => {
    fetcher.mockResolvedValueOnce(
      new Response("private upstream body", { status: 502 }),
    );
    render(<TurnstileDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Verify once" }));
    await waitFor(() => expect(widget.execute).toHaveBeenCalledOnce());
    act(() => options?.callback("one-token"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "HTTP 502 — response processing failed.",
      ),
    );
    expect(screen.queryByText(/private upstream body/)).not.toBeInTheDocument();
  });

  it("preserves HTTP status without showing unapproved response text", async () => {
    fetcher.mockResolvedValueOnce(
      Response.json({ category: "private-upstream-detail" }, { status: 403 }),
    );
    render(<TurnstileDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Verify once" }));
    await waitFor(() => expect(widget.execute).toHaveBeenCalledOnce());
    act(() => options?.callback("one-token"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "HTTP 403 — response processing failed.",
      ),
    );
    expect(
      screen.queryByText(/private-upstream-detail/),
    ).not.toBeInTheDocument();
  });

  it("shows the HTTP status and allowlisted Worker diagnostic category", async () => {
    fetcher.mockResolvedValueOnce(
      Response.json(
        { category: "siteverify_rejected", reason: "invalid_secret" },
        { status: 403 },
      ),
    );
    render(<TurnstileDiagnostic />);
    fireEvent.click(screen.getByRole("button", { name: "Verify once" }));
    await waitFor(() => expect(widget.execute).toHaveBeenCalledOnce());
    act(() => options?.callback("one-token"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "HTTP 403 — siteverify_rejected — invalid_secret",
      ),
    );
  });
});
