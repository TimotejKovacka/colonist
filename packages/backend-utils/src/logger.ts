import * as pino from "pino";
import type { Logger, LogMethod } from "@pilgrim/utils";

// biome-ignore lint/complexity/useLiteralKeys: <explanation>
const [rootLevel, ...levelsArray] = (process.env["LOG_LEVEL"] || "info").split(
  ","
);

const levels = Object.fromEntries<string>(
  levelsArray.map((entry) => {
    const [name, level] = entry.split(":");
    return [name, level] as [string, string];
  })
);

// biome-ignore lint/complexity/useLiteralKeys: accessing env variable
const logPretty = process.env["LOG_PRETTY"] === "1";

const rootPinoLogger = pino.pino({
  level: "trace",
  transport: logPretty
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: true,
        },
      }
    : undefined,
});

class LoggerImpl implements Logger {
  readonly module: string;
  readonly modulePath: string;
  readonly pinoLogger: pino.Logger;
  constructor(
    public pinoParentLogger: pino.Logger,
    module: string,
    metaIn?: Record<string, unknown>
  ) {
    const parentModulePath =
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      (pinoParentLogger.bindings()["modulePath"] as string | undefined) ?? "";
    const modulePath = `${parentModulePath}/${module}`;
    this.module = module;
    this.modulePath = modulePath;
    const meta = {
      module,
      modulePath,
      ...metaIn,
    };
    const level = Object.entries(meta).reduce<string>(
      (acc, [key, val]) => levels[`${key}:${val}`] ?? acc,
      levels[module] ?? levels[modulePath] ?? (rootLevel as string)
    );
    this.pinoLogger = pinoParentLogger.child(meta, {
      level,
      msgPrefix: `[${module}] `,
    });
  }

  error: LogMethod = (
    message: string,
    meta?: Record<string, unknown>,
    error?: unknown
  ) => this.pinoLogger.error(...toPinoLogArgs(message, meta, error));
  warn: LogMethod = (
    message: string,
    meta?: Record<string, unknown>,
    error?: unknown
  ) => this.pinoLogger.warn(...toPinoLogArgs(message, meta, error));
  info: LogMethod = (
    message: string,
    meta?: Record<string, unknown>,
    error?: unknown
  ) => this.pinoLogger.info(...toPinoLogArgs(message, meta, error));
  debug: LogMethod = (
    message: string,
    meta?: Record<string, unknown>,
    error?: unknown
  ) => this.pinoLogger.debug(...toPinoLogArgs(message, meta, error));
  trace: LogMethod = (
    message: string,
    meta?: Record<string, unknown>,
    error?: unknown
  ) => this.pinoLogger.trace(...toPinoLogArgs(message, meta, error));

  child(module: string, meta?: Record<string, unknown>) {
    return new LoggerImpl(this.pinoLogger, module, meta);
  }
}

export function createLogger(module: string, meta?: Record<string, unknown>) {
  return new LoggerImpl(rootPinoLogger, module, meta);
}

function toPinoLogArgs(
  message: string,
  meta?: Record<string, unknown>,
  error?: unknown
): [Record<string, unknown>, string] {
  const obj = { ...meta };
  if (error !== undefined) {
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    obj["err"] = error;
  }
  return [obj, message];
}
