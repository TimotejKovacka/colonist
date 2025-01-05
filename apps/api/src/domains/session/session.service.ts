import type { Redis } from "ioredis";
import type { ServiceContext } from "../../libs/service-context.js";
import {
  ServiceContainer,
  type ServiceParent,
} from "../../../../../packages/backend-utils/src/service.js";
import type { ResourceRoute } from "../../libs/resource/route.js";
import { StateStore } from "../../libs/resource/state-store.js";
import {
  type ResourceBody,
  type ResourceIds,
  generateSessionId,
  sessionResource,
  type SessionResource,
  type transferOwnershipBodySchema,
  lobbyResource,
  type LobbyResource,
  type baseUserIdentificationSchema,
  type UserId,
} from "@colonist/api-contracts";
import type { Static } from "@sinclair/typebox";
import type { AuthIssuer } from "../../libs/auth/auth-issuer.js";
import { User } from "../auth/user.entity.js";
import {
  sessionSettingsResource,
  type SessionSettingsResource,
} from "../../libs/api-contracts/session-settings.types.js";
import { assert } from "../../../../../packages/utils/src/assert.js";
import createHttpError from "http-errors";
import { validate } from "../../../../../packages/backend-utils/src/validate.js";

export class SessionService extends ServiceContainer {
  readonly redis: Redis;
  readonly sessionStore: StateStore<SessionResource>;
  readonly sessionSettingsStore: StateStore<SessionSettingsResource>;
  readonly lobbyStore: StateStore<LobbyResource>;
  readonly authIssuer: AuthIssuer;

  constructor(
    parent: ServiceParent,
    context: ServiceContext & {
      authIssuer: AuthIssuer;
    }
  ) {
    super(parent, SessionService.name);
    this.redis = context.redis;
    this.authIssuer = context.authIssuer;
    this.sessionStore = new StateStore(this, context, sessionResource);
    this.sessionSettingsStore = new StateStore(
      this,
      context,
      sessionSettingsResource
    );
    this.lobbyStore = new StateStore(this, context, lobbyResource);
    const userRepository = context.entityManager.getRepository(User);
  }

  sessionRoute(): ResourceRoute<SessionResource> {
    return {
      resource: sessionResource,
      post: (ids, body) => this.createSession(ids, body),
      patch: (ids, body) => this.sessionStore.patchExisting(ids, body),
      methods: {
        transferOwnership: (ids, body) => this.transferOwnership(ids, body),
      },
    };
  }

  sessionSettingsRoute(): ResourceRoute<SessionSettingsResource> {
    return {
      resource: sessionSettingsResource,
      tryGet: (ids) => this.sessionSettingsStore.get(ids),
    };
  }

  sessionLobbyRoute(): ResourceRoute<LobbyResource> {
    return {
      resource: lobbyResource,
      tryGet: (ids) => this.lobbyStore.get(ids),
      methods: {
        join: (ids, body) => this.joinSession(ids, body),
        leave: (ids, body) => this.leaveSession(ids, body),
      },
    };
  }

  async createSession(
    ids: ResourceIds<SessionResource>,
    body: ResourceBody<SessionResource>
  ) {
    const sessionId = generateSessionId();
    const [ownerData] = await Promise.all([
      this.sessionStore.post(ids, body, () => Promise.resolve(sessionId)),
      this.sessionSettingsStore.put({ ...ids, sessionId }, {}),
      this.lobbyStore.put(
        { ...ids, sessionId },
        {
          ...body,
          ownerId: ids.userId,
          participants: [
            {
              userId: ids.userId,
            },
          ],
        }
      ),
    ]);

    return ownerData;
  }

  async transferOwnership(
    ids: ResourceIds<SessionResource>,
    body: Static<typeof transferOwnershipBodySchema>
  ) {
    const { newOwnerId } = body;
    const [_, newOwnerData, __] = await Promise.all([
      this.sessionStore.delete(ids),
      this.sessionStore.post(
        { userId: newOwnerId, sessionId: ids.sessionId },
        {
          settings: (await this.sessionStore.get(ids)).settings,
          creatorId: (await this.sessionStore.get(ids)).creatorId,
        }
      ),
      this.lobbyStore.patchExisting(
        { sessionId: ids.sessionId },
        {
          ownerId: newOwnerId,
        }
      ),
    ]);

    return newOwnerData;
  }

  async joinSession(ids: ResourceIds<LobbyResource>, body: UserId) {
    const lobby = await this.lobbyStore.tryGet(ids);
    validate(lobby !== undefined, "Lobby not found", createHttpError.NotFound);
    validate(
      lobby.participants !== undefined && lobby.participants?.length < 4,
      "Lobby is full",
      createHttpError.BadRequest
    );
    return await this.lobbyStore.patchExisting(ids, {
      participants: [...lobby.participants, { userId: body.userId }],
    });
  }

  async leaveSession(
    ids: ResourceIds<LobbyResource>,
    body: Static<typeof baseUserIdentificationSchema>
  ) {}
}
