import type { BaseResource } from "@pilgrim/api-contracts";
import type { Message } from "./state-consumer.js";

export interface Publisher {
  publish<TResource extends BaseResource>(
    resource: TResource,
    message: Message<TResource>
  ): Promise<void>;
}
