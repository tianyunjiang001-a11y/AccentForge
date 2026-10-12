import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTurnstileAction } from "./useTurnstileAction";

function Harness({
  onToken,
  onError = () => {},
}: {
  onToken: (token: string) => void;
  onError?: (message: string) => void;
}) {
  const challenge = useTurnstileAction("speech");
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          void challenge
            .getToken()
            .then(onToken)
            .catch((error: Error) => onError(error.message))
        }
      >
        Get token
      </button>
      {challenge.element}
    </div>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("on-demand Turnstile challenge", () => {
  it("executes after each user action and obtains a fresh token", async () => {
    let callback: ((token: string) => void) | undefined;
    const renderWidget = vi.fn((_container, options) => {
      callback = options.callback;
      return "widget-id";
    });
    let sequence = 0;
    const execute = vi.fn(() => callback?.(`fresh-token-${++sequence}`));
    const reset = vi.fn();
    const remove = vi.fn();
    vi.stubGlobal("turnstile", {
      render: renderWidget,
      execute,
      reset,
      remove,
    });
    const onToken = vi.fn();
    const view = render(<Harness onToken={onToken} />);

    fireEvent.click(screen.getByRole("button", { name: "Get token" }));
    await waitFor(() => expect(onToken).toHaveBeenCalledWith("fresh-token-1"));
    fireEvent.click(screen.getByRole("button", { name: "Get token" }));
    await waitFor(() => expect(onToken).toHaveBeenCalledWith("fresh-token-2"));
    expect(renderWidget).toHaveBeenCalledOnce();
    expect(renderWidget.mock.calls[0][1]).toMatchObject({
      action: "speech",
      execution: "execute",
      appearance: "interaction-only",
    });
    expect(reset).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(remove).toHaveBeenCalledWith("widget-id");
  });

  it("releases the action after a challenge error so the learner can retry", async () => {
    let errorCallback: (() => void) | undefined;
    const renderWidget = vi.fn((_container, options) => {
      errorCallback = options["error-callback"];
      return "widget-id";
    });
    vi.stubGlobal("turnstile", {
      render: renderWidget,
      execute: () => errorCallback?.(),
      reset: vi.fn(),
      remove: vi.fn(),
    });
    const onToken = vi.fn();
    const onError = vi.fn();
    render(<Harness onToken={onToken} onError={onError} />);
    fireEvent.click(screen.getByRole("button", { name: "Get token" }));
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        "Please complete the security check and try again.",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Get token" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(2));
    expect(onToken).not.toHaveBeenCalled();
  });
});
