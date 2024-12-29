import { type Static, Type } from "@sinclair/typebox";
import { envSchema } from "env-schema";

export function getEnvConfig(): EnvConfig {
  const env = envSchema<EnvConfig>({
    schema: envConfigSchema,
    dotenv: {
      path: ".env",
    },
  });

  return env;
}

export enum NodeEnv {
  Development = "development",
  Testing = "test", // this is the default value for jest
  Staging = "staging",
  Production = "production",
}

const envConfigSchema = Type.Object({
  NODE_ENV: Type.Enum(NodeEnv, { default: NodeEnv.Development }),
  HOST: Type.String({ default: "localhost" }),
  PORT: Type.Number({ default: 3000 }),
  REDIS_PORT: Type.Number({ default: 6379 }),
  REDIS_HOST: Type.String({ default: "0.0.0.0" }),
  SESSION_SECRET_KEY: Type.String(),
});

export type EnvConfig = Static<typeof envConfigSchema>;
