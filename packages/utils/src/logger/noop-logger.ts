import type { Logger } from "./logger.js";

const noop = () => {
  //
};

export class NoopLogger implements Logger {
  module = "";
  modulePath = "";
  error = noop;
  warn = noop;
  info = noop;
  debug = noop;
  trace = noop;
  child() {
    return this;
  }
}
