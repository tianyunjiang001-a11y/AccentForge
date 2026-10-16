import { createProviderConfig } from "./config/provider-config";
import { createVoiceProfileMap } from "./config/voice-profiles";
import { KimiTextProvider } from "./providers/kimi-text-provider";
import { MiniMaxSpeechProvider } from "./providers/minimax-speech-provider";
import { handleGenerateRequest } from "./routes/generate";
import { handlePolishRequest } from "./routes/polish";
import { handleSpeechRequest } from "./routes/speech";
import { protectPaidRoute } from "./security/protect";
import { handleTurnstileDiagnostic } from "./security/turnstile-diagnostic";
import type { SecurityEnvironment } from "./security/types";
import { ChineseIdeaStructuringService } from "./services/chinese-idea-structuring";
import { EnglishGenerationService } from "./services/english-generation";
import { SpeechSynthesisService } from "./services/speech-synthesis";

export const app = {
  async fetch(
    request: Request,
    environment: SecurityEnvironment,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json(
        { service: "accentforge-worker", status: "ok" },
        {
          headers: {
            "cache-control": "no-store",
            "content-type": "application/json; charset=utf-8",
          },
        },
      );
    }

    if (url.pathname === "/api/turnstile-diagnostic") {
      return handleTurnstileDiagnostic(request, environment);
    }

    if (url.pathname === "/api/polish") {
      return protectPaidRoute(request, "polish", environment, () => {
        const provider = new KimiTextProvider(
          createProviderConfig(environment).text,
        );
        return handlePolishRequest(
          request,
          new ChineseIdeaStructuringService(provider),
        );
      });
    }

    if (url.pathname === "/api/generate") {
      return protectPaidRoute(request, "generate", environment, () => {
        const provider = new KimiTextProvider(
          createProviderConfig(environment).text,
        );
        return handleGenerateRequest(
          request,
          new EnglishGenerationService(provider),
        );
      });
    }

    if (url.pathname === "/api/speech") {
      return protectPaidRoute(request, "speech", environment, () => {
        const voices = createVoiceProfileMap(environment);
        const provider = new MiniMaxSpeechProvider(
          createProviderConfig(environment).speech,
          voices,
        );
        return handleSpeechRequest(
          request,
          new SpeechSynthesisService(provider, voices),
        );
      });
    }

    return Response.json(
      { message: "Not found" },
      {
        status: 404,
        headers: {
          "cache-control": "no-store",
          "content-type": "application/json; charset=utf-8",
        },
      },
    );
  },
} satisfies ExportedHandler<SecurityEnvironment>;
