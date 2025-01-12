import { getEnvConfig } from "./env.js";
import {
  initAuthServices,
  initServices,
  prepareHttpServer,
  prepareWebsocketServer,
  registerRoutes,
} from "./bootstrap.js";
import { ServerBooter } from "./server-booter.js";
import { createLogger, RootService } from "@pilgrim/backend-utils";
import { initFastify } from "./utils/fastify.js";

async function main() {
  process.title = "Pilgrim API";

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
  const websocketServer = await prepareWebsocketServer(rootService, fastify);
  const services = initServices(rootService, envConfig);
  const authServices = initAuthServices(rootService, {
    ...services,
    publisher: websocketServer,
  });
  const httpServer = await prepareHttpServer(
    fastify,
    authServices.authVerifier
  );

  await registerRoutes(httpServer, websocketServer, rootService, {
    ...services,
    ...authServices,
  });

  new ServerBooter(rootService, httpServer, {
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
