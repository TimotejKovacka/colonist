type ArgumentTypes<T> = T extends (...args: infer U) => infer _ ? U : never;

export class EventEmitter<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  E extends { [name: string]: (...args: any[]) => void }
> {
  private handlers: {
    [name in keyof E]?: Array<(...args: ArgumentTypes<E[name]>) => void>;
  } = {};

  emit = <N extends keyof E>(name: N, ...args: ArgumentTypes<E[N]>): void => {
    const eventHandlers = this.handlers[name];
    if (eventHandlers) {
      for (const handler of eventHandlers.slice()) {
        handler(...args);
      }
    }
  };

  emitAsync = async <N extends keyof E>(
    name: N,
    ...args: ArgumentTypes<E[N]>
  ): Promise<void> => {
    const eventHandlers = this.handlers[name];
    if (eventHandlers) {
      await Promise.all(
        eventHandlers.slice().map((handler) => handler(...args))
      );
    }
  };

  on = <N extends keyof E>(name: N, handler: E[N]): void => {
    if (!(name in this.handlers)) {
      this.handlers[name] = [];
    }
    this.handlers[name]?.push(handler);
  };

  off = <N extends keyof E>(name: N, handler: E[N]): void => {
    const eventHandlers = this.handlers[name];
    if (eventHandlers) {
      const index = eventHandlers.indexOf(handler);
      if (index !== -1) {
        eventHandlers.splice(index, 1);
      }
    }
  };

  once = <N extends keyof E>(name: N, handler: E[N]): void => {
    if (!(name in this.handlers)) {
      this.handlers[name] = [];
    }
    const wrappedHandler = ((...args: unknown[]) => {
      this.off(name, wrappedHandler);
      handler(...args);
    }) as E[N];
    this.on(name, wrappedHandler);
  };
}
