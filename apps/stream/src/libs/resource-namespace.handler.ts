import type {
  BaseResource,
  ClientToServerEvents,
} from "@pilgrim/api-contracts";
import type { ResourceSocket } from "./namespace.router.js";

export type ResourceNamespaceHandler<TResource extends BaseResource> =
  Readonly<{
    resource: TResource;

    onConnection?: (socket: ResourceSocket<TResource>) => void;
    onPatch?: ClientToServerEvents["patch"];
  }>;
