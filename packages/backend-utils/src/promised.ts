export class Promised<T = void> extends Promise<T> {
  resolve: (t: PromiseLike<T> | T) => void = () => undefined;
  reject: (e: unknown) => void = () => undefined;

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  constructor(executor: any = () => {}) {
    let resolve: (t: PromiseLike<T> | T) => void = () => undefined;
    let reject: (e: unknown) => void = () => undefined;

    super((resolve2, reject2) => {
      resolve = resolve2;
      reject = reject2;
      return executor(resolve, reject);
    });

    this.resolve = resolve;
    this.reject = reject;
  }
}
