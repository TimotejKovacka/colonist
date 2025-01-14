import { ServiceContainer, type ServiceParent } from "@pilgrim/backend-utils";
import type { ResourceNamespaceHandler } from "../../libs/resource-namespace.handler.js";
import { sessionResource, type SessionResource } from "@pilgrim/api-contracts";

export class SessionService extends ServiceContainer {
  constructor(parent: ServiceParent) {
    super(parent, SessionService.name);
  }

  handler(): ResourceNamespaceHandler<SessionResource> {
    return {
      resource: sessionResource,
      onPatch: (ref, patch) => {
        this.logger.info("got a new patch", { ref, patch });
      },
    };
  }
}
