import { createProviderConfig } from "./config/provider-config";
import type { ProviderEnvironment } from "./config/provider-config";
import { createVoiceProfileMap } from "./config/voice-profiles";
import { KimiTextProvider } from "./providers/kimi-text-provider";
import { MiniMaxSpeechProvider } from "./providers/minimax-speech-provider";
import { handleGenerateRequest } from "./routes/generate";
import { handlePolishRequest } from "./routes/polish";
import { handleSpeechRequest } from "./routes/speech";
import { ChineseIdeaStructuringService } from "./services/chinese-idea-structuring";
import { EnglishGenerationService } from "./services/english-generation";
import { SpeechSynthesisService } from "./services/speech-synthesis";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

export default {
  async fetch(
    request: Request,
    environment: ProviderEnvironment,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json(
        { service: "accentforge-worker", status: "ok" },
        { headers: jsonHeaders },
      );
    }

    if (request.method === "POST" && url.pathname === "/api/polish") {
      const providerConfig = createProviderConfig(environment);
      const textProvider = new KimiTextProvider(providerConfig.text);
      const service = new ChineseIdeaStructuringService(textProvider);

      return handlePolishRequest(request, service);
    }

    if (request.method === "POST" && url.pathname === "/api/generate") {
      const providerConfig = createProviderConfig(environment);
      const textProvider = new KimiTextProvider(providerConfig.text);
      const service = new EnglishGenerationService(textProvider);

      return handleGenerateRequest(request, service);
    }

    if (request.method === "POST" && url.pathname === "/api/speech") {
      const providerConfig = createProviderConfig(environment);
      const voiceProfiles = createVoiceProfileMap(environment);
      const speechProvider = new MiniMaxSpeechProvider(
        providerConfig.speech,
        voiceProfiles,
      );
      const service = new SpeechSynthesisService(speechProvider, voiceProfiles);

      return handleSpeechRequest(request, service);
    }

    return Response.json(
      { message: "Not found" },
      { status: 404, headers: jsonHeaders },
    );
  },
} satisfies ExportedHandler<ProviderEnvironment>;
