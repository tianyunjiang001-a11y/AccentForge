export interface ProviderEnvironment {
  KIMI_API_KEY: string;
  KIMI_BASE_URL: string;
  KIMI_TEXT_MODEL: string;
  MINIMAX_API_KEY: string;
  MINIMAX_BASE_URL: string;
  MINIMAX_TTS_MODEL: string;
  MINIMAX_BRITISH_FEMALE_VOICE_ID: string;
  MINIMAX_BRITISH_MALE_VOICE_ID: string;
  MINIMAX_AMERICAN_FEMALE_VOICE_ID: string;
  MINIMAX_AMERICAN_MALE_VOICE_ID: string;
  MINIMAX_AUSTRALIAN_FEMALE_VOICE_ID: string;
  MINIMAX_AUSTRALIAN_MALE_VOICE_ID: string;
  MINIMAX_CANADIAN_FEMALE_VOICE_ID: string;
  MINIMAX_CANADIAN_MALE_VOICE_ID: string;
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
      apiKey: environment.KIMI_API_KEY,
      baseUrl: environment.KIMI_BASE_URL,
      model: environment.KIMI_TEXT_MODEL,
    },
    speech: {
      apiKey: environment.MINIMAX_API_KEY,
      baseUrl: environment.MINIMAX_BASE_URL,
      model: environment.MINIMAX_TTS_MODEL,
    },
  };
}
