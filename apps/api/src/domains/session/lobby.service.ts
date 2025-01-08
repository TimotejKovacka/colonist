import type { Redis } from "ioredis";
import type { ServiceContext } from "../../libs/service-context.js";
import {
  lobbyResource,
  sessionSettingsResource,
  type LobbyResource,
  type ResourceIds,
  type SessionSettingsResource,
} from "@colonist/api-contracts";
import type { ResourceRoute } from "../../libs/resource-route.js";
import {
  ServiceContainer,
  StateConsumer,
  StateReader,
  StateStore,
  type Message,
  type ServiceParent,
} from "@colonist/backend-utils";

/**
 * Session settings for participants
 */
export class LobbyService extends ServiceContainer {
  readonly redis: Redis;
  readonly sessionSettingsReader: StateReader<SessionSettingsResource>;
  readonly lobbyStore: StateStore<LobbyResource>;

  constructor(parent: ServiceParent, private context: ServiceContext) {
    super(parent, LobbyService.name);
    this.redis = context.redis;
    this.sessionSettingsReader = new StateReader(
      context,
      sessionSettingsResource
    );
    this.lobbyStore = new StateStore(this, context, lobbyResource);
  }

  route(): ResourceRoute<LobbyResource> {
    return {
      resource: lobbyResource,
      tryGet: (ids) => this.lobbyStore.get(ids),
    };
  }

  createConsumers() {
    new StateConsumer(this, {
      consumerId: LobbyService.name,
      context: this.context,
      resource: sessionSettingsResource,
      processor: (messages) => this.processSettings(messages),
    });
  }

  async processSettings(messages: Message<SessionSettingsResource>[]) {
    this.logger.trace("settings process", {
      dtos: messages.map(({ dto }) => dto),
      dto: messages[0]?.dto,
    });
    for (const { dto } of messages) {
      if (dto !== undefined) {
        await this.update(dto);
      } else {
        // do nothing when session is deleted, settings will be claimed by ttl
      }
    }
    return {};
  }

  async update(ids: ResourceIds<SessionSettingsResource>) {
    try {
      const settings = await this.sessionSettingsReader.get(ids);
      await this.lobbyStore.patchExisting(ids, settings);
    } catch (err) {
      this.logger.error("Failed to update lobby", { ids }, err);
    }
  }
}
