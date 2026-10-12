export type ProviderOperation = "text-generation" | "speech-synthesis";

export type ProviderErrorCode =
  | "not-configured"
  | "not-implemented"
  | "upstream-failure"
  | "upstream-rate-limited"
  | "timeout"
  | "invalid-response";

interface ProviderErrorOptions {
  code: ProviderErrorCode;
  operation: ProviderOperation;
  message: string;
  retryable?: boolean;
}

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly operation: ProviderOperation;
  readonly retryable: boolean;

  constructor(options: ProviderErrorOptions) {
    super(options.message);
    this.name = "ProviderError";
    this.code = options.code;
    this.operation = options.operation;
    this.retryable = options.retryable ?? false;
  }
}
