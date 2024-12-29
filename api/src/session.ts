import "@fastify/session";

declare module "@fastify/session" {
  interface FastifySessionObject {
    player?: {
      id: string;
      name: string;
    };
  }
}
