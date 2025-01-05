import type { ResourceRoute } from "../../libs/resource/route.js";
import { StateStore } from "../../libs/resource/state-store.js";
import type { ServiceContext } from "../../libs/service-context.js";
import {
  ServiceContainer,
  type ServiceParent,
} from "../../../../../packages/backend-utils/src/service.js";
import {
  mapResource,
  type MapResource,
} from "../../libs/api-contracts/map.types.js";

export class MapService extends ServiceContainer {
  readonly resource: MapResource = mapResource;
  readonly store: StateStore<MapResource>;
  constructor(parent: ServiceParent, context: ServiceContext) {
    super(parent, MapService.name);
    this.store = new StateStore(this, context, this.resource);
  }

  route(): ResourceRoute<MapResource> {
    return {
      resource: this.resource,
      tryGet: (ids) => this.store.tryGet(ids),
      post: (ids, body) => this.store.post(ids, body),
    };
  }
}
