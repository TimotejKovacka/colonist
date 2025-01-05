import { getEnvConfig } from "./env.js";
import { RootService } from "../../../packages/backend-utils/src/service.js";
import { initServices, prepareServer, registerRoutes } from "./bootstrap.js";
import { ServerBooter } from "./server-booter.js";

async function main() {
  process.title = "Settlers API";

  const envConfig = getEnvConfig();

  const rootService = new RootService();

  const services = initServices(rootService, envConfig);
  const server = await prepareServer(services, envConfig);

  await registerRoutes(server, rootService, services);

  new ServerBooter(rootService, server, {
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
