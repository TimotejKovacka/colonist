import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import Fastify, {
  type FastifyBaseLogger,
  type FastifyHttpOptions,
  type FastifyInstance,
} from "fastify";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

export function initFastify(
  opts?: FastifyHttpOptions<
    Server<typeof IncomingMessage, typeof ServerResponse>,
    FastifyBaseLogger
  >
) {
  const fastify = Fastify(opts).withTypeProvider<TypeBoxTypeProvider>();
  return fastify;
}

export type FastifyTypeboxInstance = FastifyInstance<
  Server<typeof IncomingMessage, typeof ServerResponse>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;
