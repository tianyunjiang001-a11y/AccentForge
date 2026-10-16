import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { TurnstileDiagnostic } from "./security/TurnstileDiagnostic";
import "./styles.css";

const isDiagnostic = window.location.pathname === "/__turnstile-check";
const diagnosticAllowed =
  window.location.origin === "https://accentforge.pages.dev" ||
  import.meta.env.DEV;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isDiagnostic ? (
      diagnosticAllowed ? (
        <TurnstileDiagnostic />
      ) : (
        <p>Not found.</p>
      )
    ) : (
      <App />
    )}
  </StrictMode>,
);
