export interface ProviderEnvironment {
  KIMI_API_KEY?: string;
  KIMI_BASE_URL?: string;
  KIMI_TEXT_MODEL?: string;
  MINIMAX_API_KEY?: string;
  MINIMAX_BASE_URL?: string;
  MINIMAX_TTS_MODEL?: string;
  MINIMAX_TTS_SPEED?: string;
  MINIMAX_BRITISH_FEMALE_VOICE_ID?: string;
  MINIMAX_AMERICAN_FEMALE_VOICE_ID?: string;
  MINIMAX_AMERICAN_MALE_VOICE_ID?: string;
  MINIMAX_AUSTRALIAN_MALE_VOICE_ID?: string;
}

export interface KimiProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface MiniMaxProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  speed: number;
}

export interface ProviderConfig {
  text: KimiProviderConfig;
  speech: MiniMaxProviderConfig;
}

export function createProviderConfig(
  environment: ProviderEnvironment,
): ProviderConfig {
  return {
    text: {
      apiKey: environment.KIMI_API_KEY ?? "",
      baseUrl: environment.KIMI_BASE_URL ?? "",
      model: environment.KIMI_TEXT_MODEL ?? "",
    },
    speech: {
      apiKey: environment.MINIMAX_API_KEY ?? "",
      baseUrl: environment.MINIMAX_BASE_URL ?? "",
      model: environment.MINIMAX_TTS_MODEL ?? "",
      speed: parseSpeechSpeed(environment.MINIMAX_TTS_SPEED),
    },
  };
}

function parseSpeechSpeed(value: string | undefined) {
  if (value === undefined || !value.trim()) {
    return 1;
  }

  const speed = Number(value);

  return Number.isFinite(speed) && speed >= 0.5 && speed <= 2 ? speed : 1;
}
