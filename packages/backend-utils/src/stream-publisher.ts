import type { BaseResource, ResourcePatch } from "@pilgrim/api-contracts";
import axios, { type AxiosInstance } from "axios";
import { ServiceContainer, type ServiceParent } from "./service.js";
import type { Publisher } from "./resource/publisher.js";
import type { Message } from "./resource/state-consumer.js";
import { generatePatch } from "@pilgrim/utils";

export class StreamPublisher extends ServiceContainer implements Publisher {
  readonly axios: AxiosInstance;

  constructor(parent: ServiceParent, { host }: { host: string }) {
    super(parent, StreamPublisher.name);
    this.axios = axios.create({
      baseURL: host,
    });
  }

  async publish<TResource extends BaseResource>(
    _resource: TResource,
    message: Message<TResource>
  ): Promise<void> {
    const patch: ResourcePatch = {
      patch: generatePatch(message.oldDto, message.dto),
      oldModifiedAtMs: message.oldDto?.modifiedAtMs,
    };
    this.logger.debug("publish", {
      message,
      patch,
    });
    await this.axios.post("/publish", {
      ref: message.ref,
      patch,
    });
  }
}
