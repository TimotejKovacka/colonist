export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

export const logLevels: LogLevel[] = [
  "error",
  "warn",
  "info",
  "debug",
  "trace",
];

export type LogMethod = (
  message: string,
  meta?: Record<string, unknown>,
  error?: unknown
) => void;

export interface LoggerParent {
  child: (module: string, meta?: Record<string, unknown>) => Logger;
}

export interface Logger extends LoggerParent {
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  debug: LogMethod;
  trace: LogMethod;

  readonly module: string;
  readonly modulePath: string;
}
