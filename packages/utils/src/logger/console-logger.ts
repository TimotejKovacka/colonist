import type { Logger, LogLevel } from "./logger";

export class ConsoleLogger implements Logger {
  readonly module: string;
  readonly modulePath: string;
  protected level: LogLevel;
  protected meta?: Record<string, unknown>;

  constructor({
    module = "root",
    parent,
    level = "trace",
    meta,
  }: {
    module?: string;
    parent?: Logger;
    level?: LogLevel;
    meta?: Record<string, unknown>;
  } = {}) {
    this.module = module;
    this.level = level;
    this.meta = meta;
    this.modulePath = parent ? `${parent.modulePath}/${module}` : module;
  }

  error(message: string, meta?: Record<string, unknown>, error?: unknown) {
    this.log("error", message, meta, error);
  }

  warn(message: string, meta?: Record<string, unknown>, error?: unknown) {
    this.log("warn", message, meta, error);
  }

  info(message: string, meta?: Record<string, unknown>, error?: unknown) {
    this.log("info", message, meta, error);
  }

  debug(message: string, meta?: Record<string, unknown>, error?: unknown) {
    this.log("debug", message, meta, error);
  }

  trace(message: string, meta?: Record<string, unknown>, error?: unknown) {
    this.log("trace", message, meta, error);
  }

  child(module: string, meta?: Record<string, unknown>) {
    return new ConsoleLogger({ module, level: this.level, parent: this, meta });
  }

  protected combineMeta(
    meta?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    return this.meta || meta ? { ...this.meta, ...meta } : undefined;
  }

  private log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
    error?: unknown
  ) {
    if (this.levelEnabled(level)) {
      const enchancedMessage = this.modulePath
        ? `[${this.modulePath}] ${message}`
        : message;
      const args = [enchancedMessage, this.combineMeta(meta), error].filter(
        (arg) => arg !== undefined
      );
      console[level](...args);
    }
  }

  private levelEnabled(level: LogLevel) {
    return logLevelNum(this.level) <= logLevelNum(level);
  }
}

function logLevelNum(level: LogLevel) {
  if (level === "trace") {
    return 0;
  }
  if (level === "debug") {
    return 1;
  }
  if (level === "info") {
    return 2;
  }
  if (level === "warn") {
    return 3;
  }
  if (level === "error") {
    return 4;
  }

  return -1;
}
