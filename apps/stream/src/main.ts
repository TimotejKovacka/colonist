import { createLogger, RootService } from "@pilgrim/backend-utils";
import { getEnvConfig } from "./env.js";
import { initFastify } from "./utils/fastify.js";
import { ServerBooter } from "./server-booter.js";
import { WebSocketServer } from "./utils/websocket.js";
import {
  prepareFastify,
  registerHttpRoutes,
  registerSocketNamespaces,
} from "./bootstrap.js";

async function main() {
  process.title = "Settlers Stream";

  const envConfig = getEnvConfig();

  const rootService = new RootService();

  const fastify = initFastify({
    logger: createLogger("fastify").pinoLogger,
    ajv: {
      customOptions: {
        removeAdditional: "all",
        useDefaults: false,
      },
    },
  });
  await prepareFastify(fastify);

  const websocket = new WebSocketServer(rootService, fastify.server);
  await registerSocketNamespaces(rootService, websocket);

  await registerHttpRoutes(fastify, websocket);

  new ServerBooter(rootService, fastify, {
    host: envConfig.HOST,
    port: envConfig.PORT,
  });

  await rootService.start();

  return async () => {
    await rootService.stop();
  };
}

const mainPromise = main();

process.on("SIGINT", async () => {
  const close = await mainPromise;
  await close();
});
