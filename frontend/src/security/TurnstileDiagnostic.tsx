import { useRef, useState } from "react";

import { useTurnstileAction } from "./useTurnstileAction";

type SafeResult = {
  category: string;
  reason?: string;
};

const SAFE_CATEGORIES = new Set([
  "before_siteverify",
  "siteverify_transport_failure",
  "siteverify_http_failure",
  "siteverify_rejected",
  "hostname_mismatch",
  "action_mismatch",
  "verified",
]);
const SAFE_REASONS = new Set([
  "invalid_request",
  "token_missing",
  "token_too_long",
  "invalid_secret",
  "invalid_response",
  "expired_or_replayed",
  "other",
]);

// Unlinked, temporary owner-only test interface. It never sends learner text.
export function TurnstileDiagnostic() {
  const challenge = useTurnstileAction("polish");
  const started = useRef(false);
  const [status, setStatus] = useState("Ready for one non-paid check.");

  async function verify() {
    if (started.current) return;
    started.current = true;
    setStatus("Checking…");
    let turnstileToken: string;
    try {
      turnstileToken = await challenge.getToken();
    } catch {
      setStatus("Token acquisition failed before POST.");
      return;
    }

    let response: Response;
    try {
      response = await fetch("/api/turnstile-diagnostic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ turnstileToken }),
      });
    } catch {
      setStatus("POST network failure.");
      return;
    }

    try {
      const result: unknown = await response.json();
      if (!isSafeResult(result)) throw new Error("Invalid result");
      setStatus(
        `HTTP ${response.status} — ${result.category}${result.reason ? ` — ${result.reason}` : ""}`,
      );
    } catch {
      setStatus(`HTTP ${response.status} — response processing failed.`);
    }
  }

  return (
    <main className="app-shell" aria-label="Turnstile diagnostic">
      <section className="editor-card">
        <h1>Turnstile verification</h1>
        <p>This temporary check does not call Kimi or MiniMax.</p>
        <button type="button" onClick={verify} disabled={started.current}>
          Verify once
        </button>
        {challenge.element}
        <p role="status">{status}</p>
      </section>
    </main>
  );
}

function isSafeResult(value: unknown): value is SafeResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "category" in value &&
    typeof value.category === "string" &&
    SAFE_CATEGORIES.has(value.category) &&
    (!("reason" in value) ||
      (typeof value.reason === "string" && SAFE_REASONS.has(value.reason)))
  );
}
