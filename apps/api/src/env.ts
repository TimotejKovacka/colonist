import { type Static, Type } from "@sinclair/typebox";
import { envSchema } from "env-schema";
import { fixNewlines } from "../../../packages/utils/src/fix-newlines.js";

export function getEnvConfig(): EnvConfig {
  const env = envSchema<EnvConfig>({
    schema: envConfigSchema,
    dotenv: {
      path: ".env",
    },
  });

  env.PRIVATE_KEY = fixNewlines(env.PRIVATE_KEY);
  env.PUBLIC_KEY = fixNewlines(env.PUBLIC_KEY);

  return env;
}

export enum NodeEnv {
  Development = "development",
  Testing = "test", // this is the default value for jest
  Staging = "staging",
  Production = "production",
}

export enum BooleanFlag {
  Off = "0",
  On = "1",
}

const envConfigSchema = Type.Object({
  NODE_ENV: Type.Enum(NodeEnv, { default: NodeEnv.Development }),
  HOST: Type.String({ default: "localhost" }),
  PORT: Type.Number({ default: 3000 }),
  REDIS_PORT: Type.Number({ default: 6379 }),
  REDIS_HOST: Type.String({ default: "0.0.0.0" }),
  SESSION_SECRET_KEY: Type.String(),
  DEBUG_TWEAKS: Type.Enum(BooleanFlag, { default: BooleanFlag.Off }),
  LOG_PRETTY: Type.Enum(BooleanFlag, { default: BooleanFlag.Off }),
  POSTGRES_HOST: Type.String({ default: "127.0.0.1" }),
  POSTGRES_PORT: Type.Number({ default: 5432 }),
  POSTGRES_USERNAME: Type.String({ default: "admin" }),
  POSTGRES_PASSWORD: Type.String({ default: "admin" }),
  PRIVATE_KEY: Type.String(),
  PUBLIC_KEY: Type.String(),
});

export type EnvConfig = Static<typeof envConfigSchema>;
