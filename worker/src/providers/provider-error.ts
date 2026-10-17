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
  upstreamStatus?: number;
}

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly operation: ProviderOperation;
  readonly retryable: boolean;
  readonly upstreamStatus: number | undefined;

  constructor(options: ProviderErrorOptions) {
    super(options.message);
    this.name = "ProviderError";
    this.code = options.code;
    this.operation = options.operation;
    this.retryable = options.retryable ?? false;
    this.upstreamStatus =
      typeof options.upstreamStatus === "number" &&
      Number.isInteger(options.upstreamStatus) &&
      options.upstreamStatus >= 100 &&
      options.upstreamStatus <= 599
        ? options.upstreamStatus
        : undefined;
  }
}
