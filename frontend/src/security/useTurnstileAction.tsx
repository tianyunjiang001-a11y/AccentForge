import { useEffect, useRef } from "react";

type Action = "polish" | "generate" | "speech";

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: Action;
      execution: "execute";
      appearance: "interaction-only";
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      "timeout-callback": () => void;
      "unsupported-callback": () => void;
    },
  ): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SITE_KEYS = new Set([
  TEST_SITE_KEY,
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);
let scriptPromise: Promise<TurnstileApi> | null = null;

export class SecurityChallengeError extends Error {
  constructor() {
    super("Please complete the security check and try again.");
    this.name = "SecurityChallengeError";
  }
}

function siteKey() {
  const configured = import.meta.env.VITE_TURNSTILE_SITE_KEY as
    string | undefined;
  const value =
    configured?.trim() || (import.meta.env.DEV ? TEST_SITE_KEY : "");
  if (!value || (import.meta.env.PROD && TEST_SITE_KEYS.has(value))) {
    throw new SecurityChallengeError();
  }
  return value;
}

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      script.remove();
      reject(new SecurityChallengeError());
    }, 15_000);
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new SecurityChallengeError());
      }
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      script.remove();
      reject(new SecurityChallengeError());
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    scriptPromise = null;
    throw error;
  });
  return scriptPromise;
}

export function useTurnstileAction(action: Action) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const pending = useRef<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  } | null>(null);

  useEffect(() => {
    return () => {
      pending.current?.reject(new SecurityChallengeError());
      pending.current = null;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
    };
  }, []);

  async function getToken() {
    if (pending.current) throw new SecurityChallengeError();
    const key = siteKey();
    const turnstile = await loadScript();
    if (!container.current) throw new SecurityChallengeError();

    if (!widgetId.current) {
      widgetId.current = turnstile.render(container.current, {
        sitekey: key,
        action,
        execution: "execute",
        appearance: "interaction-only",
        callback: (token) => {
          pending.current?.resolve(token);
          pending.current = null;
        },
        "error-callback": () => {
          pending.current?.reject(new SecurityChallengeError());
          pending.current = null;
        },
        "expired-callback": () => {
          pending.current?.reject(new SecurityChallengeError());
          pending.current = null;
        },
        "timeout-callback": () => {
          pending.current?.reject(new SecurityChallengeError());
          pending.current = null;
        },
        "unsupported-callback": () => {
          pending.current?.reject(new SecurityChallengeError());
          pending.current = null;
        },
      });
    }

    return new Promise<string>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        pending.current?.reject(new SecurityChallengeError());
        pending.current = null;
      }, 120_000);
      pending.current = {
        resolve: (token) => {
          window.clearTimeout(timer);
          resolve(token);
        },
        reject: (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      };
      try {
        turnstile.reset(widgetId.current!);
        turnstile.execute(widgetId.current!);
      } catch {
        pending.current?.reject(new SecurityChallengeError());
        pending.current = null;
      }
    });
  }

  return {
    getToken,
    element: <div className="turnstile-slot" ref={container} />,
  };
}
