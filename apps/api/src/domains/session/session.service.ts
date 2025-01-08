import type { Redis } from "ioredis";
import type { ServiceContext } from "../../libs/service-context.js";
import {
  type ResourceIds,
  generateSessionId,
  sessionResource,
  type SessionResource,
  type SessionSettingsResource,
  sessionSettingsResource,
  idsModifiedAtOfResourcce,
} from "@colonist/api-contracts";
import createHttpError from "http-errors";
import type { ResourceRoute } from "../../libs/resource-route.js";
import {
  ServiceContainer,
  StateReader,
  StateStore,
  validate,
  type ServiceParent,
} from "@colonist/backend-utils";
import { getProfile } from "../../libs/auth/profile.js";

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
      tryGet: (ids) => this.sessionStore.tryGet(ids),
      post: (ids) =>
        this.sessionStore.post(
          ids,
          {
            participants: {
              [ids.userId]: getProfile().name,
            },
          },
          () => Promise.resolve(generateSessionId())
        ),
      methods: {
        join: (ids) => this.joinSession(ids),
        leave: (ids) => this.leaveSession(ids),
      },
    };
  }

  async joinSession(ids: ResourceIds<SessionResource>) {
    const session = await this.sessionStore.get(ids);
    validate(
      session.participants !== undefined,
      "Session needs to have at least 1 participant",
      createHttpError.BadRequest
    );
    validate(
      session.participants[ids.userId] !== undefined,
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
        [ids.userId]: getProfile().name,
      },
    });
  }

  async leaveSession(ids: ResourceIds<SessionResource>) {
    const session = await this.sessionStore.get(ids);
    validate(
      session.participants !== undefined,
      "Session needs to have at least 1 participant",
      createHttpError.BadRequest
    );
    validate(
      session.participants[ids.userId] !== undefined,
      "Is not part of a session",
      createHttpError.BadRequest
    );
    const participantsLength = Object.entries(session.participants).length;
    if (participantsLength === 1) {
      return await this.sessionStore.patchExisting(ids, { isDeleted: true });
    }
    delete session.participants[ids.userId];
    return await this.sessionStore.patchExisting(ids, {
      participants: session.participants,
    });
  }
}
