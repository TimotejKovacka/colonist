import type {
  BaseResource,
  ResourceIds,
  ResourceRef,
} from "./lib/resource.types.js";
import type { ResourcePatch } from "./lib/stream.types.js";

export type ServerToClientEvents = {
  // Patch already carries a ref inside it
  patch: <TResource extends BaseResource>(
    ref: ResourceRef<TResource>,
    patch: ResourcePatch
  ) => void;
  error: (error: { message: string }) => void;
};

export type ClientToServerEvents<
  TResource extends BaseResource = BaseResource
> = {
  // Patch already carries a ref inside it
  patch: <TResourceIndividual extends BaseResource = TResource>(
    ref: ResourceRef<TResourceIndividual>,
    patch: ResourcePatch
  ) => void;
  subscribe: <TResourceIndividual extends BaseResource = TResource>(
    ref: ResourceRef<TResourceIndividual>
  ) => void;
  unsubscribe: <TResourceIndividual extends BaseResource = TResource>(
    ref: ResourceRef<TResourceIndividual>
  ) => void;
};

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData<TAdditional = unknown> {
  userId: string;
  subscribedResources: Set<string>;
  ids: TAdditional extends BaseResource ? ResourceIds<TAdditional> : never;
}

export const SOCKET_PATH = "/socket.io";
