import type { Redis } from "ioredis";
import type { ServiceContext } from "../../libs/service-context.js";
import {
  type ResourceIds,
  generateSessionId,
  sessionResource,
  type SessionResource,
  type SessionSettingsResource,
  sessionSettingsResource,
} from "@pilgrim/api-contracts";
import createHttpError from "http-errors";
import type { ResourceRoute } from "../../libs/resource-route.js";
import {
  ServiceContainer,
  StateReader,
  StateStore,
  validate,
  type ServiceParent,
} from "@pilgrim/backend-utils";
import { getProfile } from "../../libs/auth/profile.js";
import type { ResourceHandler } from "../../libs/resource-router.js";

export class SessionService extends ServiceContainer {
  readonly redis: Redis;
  readonly sessionStore: StateStore<SessionResource>;
  readonly sessionSettingsReader: StateReader<SessionSettingsResource>;

  constructor(parent: ServiceParent, context: ServiceContext) {
    super(parent, SessionService.name);
    this.redis = context.redis;
    this.sessionStore = new StateStore(this, context, sessionResource);
    this.sessionSettingsReader = new StateReader(
      context,
      sessionSettingsResource
    );
  }

  route(): ResourceRoute<SessionResource> {
    return {
      resource: sessionResource,
      tryGet: (ids, query) => this.get(ids, query),
      post: async (ids) => {
        const { id, name } = getProfile();
        return await this.sessionStore.post(
          ids,
          {
            owner: id,
            participants: {
              [id]: name,
            },
          },
          () => Promise.resolve(generateSessionId())
        );
      },
      methods: {
        // join: (ids) => this.joinSession(ids),
        leave: (ids) => this.leaveSession(ids),
      },
    };
  }

  wsHandler(): ResourceHandler<SessionResource> {
    return {
      resource: sessionResource,
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
      onPatch: async (socket, ids, patch) => {
        this.logger.info("New patch", { ids, socketId: socket.id, patch });
      },
    };
  }

  async get(ids: ResourceIds<SessionResource>, query: { autoJoin: boolean }) {
    const autoJoin = query.autoJoin === true;
    const session = await this.sessionStore.tryGet(ids);
    if (!session) {
      return undefined;
    }

    const { id } = getProfile();
    const isInSession = session.participants?.[id] !== undefined;
    if (autoJoin && !isInSession) {
      await this.joinSession(ids);
      // Return the updated session after joining
      return await this.sessionStore.tryGet(ids);
    }

    return session;
  }

  async joinSession(ids: ResourceIds<SessionResource>) {
    const { id, name } = getProfile();
    const session = await this.sessionStore.get(ids);
    validate(
      session.participants !== undefined,
      "Session needs to have at least 1 participant",
      createHttpError.BadRequest
    );
    this.logger.warn("huh", { ids });
    validate(
      session.participants[id] === undefined,
      "Already part of session",
      createHttpError.BadRequest
    );

    const participantsLength = Object.entries(session.participants).length;
    const sessionSettings = await this.sessionSettingsReader.get(ids);
    validate(
      participantsLength < (sessionSettings.maxPlayers ?? 4), //
      "Session is full",
      createHttpError.BadRequest
    );

    return await this.sessionStore.patchExisting(ids, {
      participants: {
        ...session.participants,
        [id]: name,
      },
    });
  }

  async leaveSession(ids: ResourceIds<SessionResource>) {
    const { id } = getProfile();
    const session = await this.sessionStore.get(ids);
    validate(
      session.participants !== undefined,
      "Session needs to have at least 1 participant",
      createHttpError.BadRequest
    );
    validate(
      session.participants[id] !== undefined,
      "Is not part of a session",
      createHttpError.BadRequest
    );
    const participantsLength = Object.entries(session.participants).length;
    if (participantsLength === 1) {
      return await this.sessionStore.patchExisting(ids, { isDeleted: true });
    }
    delete session.participants[id];
    return await this.sessionStore.patchExisting(ids, {
      participants: session.participants,
    });
  }
}
