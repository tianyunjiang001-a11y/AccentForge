import type { MiniMaxProviderConfig } from "../config/provider-config";
import type { VoiceProfileMap } from "../config/voice-profiles";
import { ProviderError } from "./provider-error";
import { readProviderText } from "./response-reader";
import type {
  SpeechSynthesisProvider,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
} from "./speech-provider";

export class MiniMaxSpeechProvider implements SpeechSynthesisProvider {
  private readonly fetcher: typeof fetch;

  constructor(
    private readonly config: MiniMaxProviderConfig,
    private readonly voiceProfiles: VoiceProfileMap,
    fetcher?: typeof fetch,
  ) {
    this.fetcher = fetcher ?? ((input, init) => globalThis.fetch(input, init));
  }

  async synthesizeSpeech(
    request: SpeechSynthesisRequest,
  ): Promise<SpeechSynthesisResult> {
    const endpoint = this.speechSynthesisUrl();
    const voiceId = this.voiceProfiles[request.accent][request.voice];

    if (!this.config.apiKey || !this.config.model || !voiceId) {
      throw this.notConfiguredError();
    }

    let response: Response;

    try {
      response = await this.fetcher(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          text: request.text,
          stream: false,
          voice_setting: {
            voice_id: voiceId,
            speed: this.config.speed,
            vol: 1,
            pitch: 0,
          },
          audio_setting: {
            sample_rate: 32_000,
            bitrate: 128_000,
            format: "mp3",
            channel: 1,
          },
          language_boost: "English",
          subtitle_enable: false,
          output_format: "hex",
        }),
        signal: AbortSignal.timeout(120_000),
      });
    } catch (error) {
      throw new ProviderError({
        code: isTimeout(error) ? "timeout" : "upstream-failure",
        operation: "speech-synthesis",
        message: "The speech provider request failed.",
        retryable: true,
      });
    }

    if (!response.ok) {
      throw new ProviderError({
        code:
          response.status === 429
            ? "upstream-rate-limited"
            : "upstream-failure",
        operation: "speech-synthesis",
        message: "The speech provider returned an error.",
        retryable: response.status === 429 || response.status >= 500,
      });
    }

    let responseBody: string;

    try {
      responseBody = await readProviderText(response, 12_000_000);
    } catch {
      throw new ProviderError({
        code: "upstream-failure",
        operation: "speech-synthesis",
        message: "The speech provider response could not be read.",
        retryable: true,
      });
    }

    return this.parseResponse(responseBody);
  }

  private speechSynthesisUrl() {
    if (!this.config.baseUrl) {
      throw this.notConfiguredError();
    }

    let baseUrl: URL;

    try {
      baseUrl = new URL(this.config.baseUrl);
    } catch {
      throw this.notConfiguredError();
    }

    if (baseUrl.protocol !== "https:") {
      throw this.notConfiguredError();
    }

    const endpointPath = "/v1/t2a_v2";
    const currentPath = baseUrl.pathname.replace(/\/+$/, "");

    if (!currentPath.endsWith(endpointPath)) {
      baseUrl.pathname = `${currentPath}${endpointPath}`;
    } else {
      baseUrl.pathname = currentPath;
    }

    baseUrl.search = "";
    baseUrl.hash = "";

    return baseUrl.toString();
  }

  private parseResponse(responseBody: string): SpeechSynthesisResult {
    let payload: unknown;

    try {
      payload = JSON.parse(responseBody);
    } catch {
      throw this.invalidResponseError();
    }

    if (!isMiniMaxSpeechResponse(payload)) {
      throw this.invalidResponseError();
    }

    if (
      payload.base_resp.status_code !== 0 ||
      payload.data.status !== 2 ||
      !isHexAudio(payload.data.audio)
    ) {
      throw this.invalidResponseError();
    }

    if (
      payload.extra_info?.audio_format !== undefined &&
      payload.extra_info.audio_format !== "mp3"
    ) {
      throw this.invalidResponseError();
    }

    const audio = decodeHexAudio(payload.data.audio);
    if (!hasMp3Signature(audio)) throw this.invalidResponseError();

    return {
      audio,
      contentType: "audio/mpeg",
      durationMs: validMetric(payload.extra_info?.audio_length),
      usageCharacters: validMetric(payload.extra_info?.usage_characters),
    };
  }

  private notConfiguredError() {
    return new ProviderError({
      code: "not-configured",
      operation: "speech-synthesis",
      message: "The speech provider is not configured.",
    });
  }

  private invalidResponseError() {
    return new ProviderError({
      code: "invalid-response",
      operation: "speech-synthesis",
      message: "The speech provider returned an invalid response.",
    });
  }
}

function isTimeout(error: unknown) {
  return error instanceof Error && error.name === "TimeoutError";
}

function hasMp3Signature(value: ArrayBuffer) {
  const bytes = new Uint8Array(value);
  return (
    bytes.length >= 6 &&
    ((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))
  );
}

interface MiniMaxSpeechResponse {
  data: {
    audio: string;
    status: number;
  };
  extra_info?: {
    audio_format?: string;
    audio_length?: number;
    usage_characters?: number;
  };
  base_resp: {
    status_code: number;
  };
}

function isMiniMaxSpeechResponse(
  value: unknown,
): value is MiniMaxSpeechResponse {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.base_resp)) {
    return false;
  }

  if (
    typeof value.data.audio !== "string" ||
    typeof value.data.status !== "number" ||
    typeof value.base_resp.status_code !== "number"
  ) {
    return false;
  }

  if (value.extra_info === undefined) {
    return true;
  }

  return (
    isRecord(value.extra_info) &&
    optionalString(value.extra_info.audio_format) &&
    optionalNumber(value.extra_info.audio_length) &&
    optionalNumber(value.extra_info.usage_characters)
  );
}

function isHexAudio(value: string) {
  return (
    value.length > 0 && value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value)
  );
}

function decodeHexAudio(value: string) {
  const bytes = new Uint8Array(value.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes.buffer;
}

function validMetric(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function optionalNumber(value: unknown) {
  return value === undefined || typeof value === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
