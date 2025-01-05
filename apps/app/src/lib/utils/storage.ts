import { ConsoleLogger } from "@/lib/logger";

abstract class BaseStorage<T> {
  private readonly logger = new ConsoleLogger({ module: "BaseStorage" });
  constructor(private wrappedStorage: Storage) {}

  clear() {
    try {
      this.wrappedStorage.clear();
    } catch (err) {
      this.logError(err, "clear");
    }
  }

  get(key: string): T | undefined {
    try {
      const rawValue = this.wrappedStorage.getItem(key);
      if (rawValue !== null && rawValue !== undefined) {
        return JSON.parse(rawValue) as T;
      }
    } catch (err) {
      this.logError(err, "get", key);
    }
  }

  remove(key: string) {
    try {
      this.wrappedStorage.removeItem(key);
    } catch (err) {
      this.logError(err, "remove", key);
    }
  }

  set(key: string, value: T) {
    try {
      this.wrappedStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      this.logError(err, "set", key);
    }
  }

  private logError(error: unknown, method: string, key?: string) {
    this.logger.error(`${method} failed`, { key }, error);
  }
}

export class LocalStorage<T> extends BaseStorage<T> {
  constructor() {
    super(localStorage);
  }
}

export class SessionStorage<T> extends BaseStorage<T> {
  constructor() {
    super(sessionStorage);
  }
}
