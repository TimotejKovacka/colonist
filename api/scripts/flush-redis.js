import { Redis } from "ioredis";

async function main() {
  const client = new Redis(6379, "localhost");
  await client.flushdb();
  client.disconnect();
}

main();
