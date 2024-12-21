export class ServiceNotInitializedError extends Error {
  constructor(
    readonly serviceName: string,
    message: string = `Service '${serviceName}' has not been initialized.`
  ) {
    super(message);
    this.name = "ServiceNotInitializedError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceNotInitializedError);
    }
  }
}
