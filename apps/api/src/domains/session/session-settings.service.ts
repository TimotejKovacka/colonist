import {
  lobbyResource,
  sessionResource,
  sessionSettingsResource,
  type LobbyResource,
  type SessionResource,
  type SessionSettingsResource,
} from "@pilgrim/api-contracts";
import {
  ServiceContainer,
  StateConsumer,
  StateReader,
  StateStore,
  type Message,
  type ServiceContext,
  type ServiceParent,
} from "@pilgrim/backend-utils";
import type { ResourceRoute } from "../../libs/resource-route.js";
import type { ResourceHandler } from "../../libs/resource-router.js";

/**
 * Session settings service to be serving the owner of a session
 */
export class SessionSettingsService extends ServiceContainer {
  readonly sessionReader: StateReader<SessionResource>;
  readonly sessionSettingsStore: StateStore<SessionSettingsResource>;
  readonly lobbyStore: StateStore<LobbyResource>;

  constructor(parent: ServiceParent, private context: ServiceContext) {
    super(parent, SessionSettingsService.name);
    this.sessionReader = new StateReader(context, sessionResource);
    this.sessionSettingsStore = new StateStore(
      this,
      context,
      sessionSettingsResource
    );
    this.lobbyStore = new StateStore(this, context, lobbyResource);
  }

  route(): ResourceRoute<SessionSettingsResource> {
    return {
      resource: sessionSettingsResource,
      tryGet: (ids) => this.sessionSettingsStore.tryGet(ids),
      patch: (ids, body) => this.sessionSettingsStore.patchExisting(ids, body),
    };
  }

  wsHandler(): ResourceHandler<SessionSettingsResource> {
    return {
      resource: sessionSettingsResource,
      onSubscribe: async (socket, ids) => {
        this.logger.info("New subscription to resource", {
          ids,
          socketId: socket.id,
        });
      },
      onUnsubscribe: async (socket, ids) => {
        this.logger.info("Unsubscribed from resource", {
          ids,
          socketId: socket.id,
        });
      },
      onPatch: async (socket, ids) => {
        this.logger.info("New patch", { ids, socketId: socket.id });
      },
    };
  }

  createConsumers() {
    new StateConsumer(this, {
      consumerId: SessionSettingsService.name,
      context: this.context,
      resource: sessionResource,
      processor: (messages) => this.processSession(messages),
    });
  }

  async processSession(messages: Message<SessionResource>[]) {
    this.logger.trace("session process", {
      dtos: messages.map(({ dto }) => dto),
      dto: messages[0]?.dto,
    });
    for (const { dto } of messages) {
      if (dto !== undefined) {
        await this.sessionSettingsStore.put(dto, {});
      } else {
        // do nothing when session is deleted, settings will be claimed by ttl
      }
    }
    return {};
  }
}
