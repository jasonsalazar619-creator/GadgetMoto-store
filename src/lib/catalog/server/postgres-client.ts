import "server-only";

import postgres from "postgres";

import { getStorefrontDatabaseUrl } from "./config";

type StorefrontDatabaseClient = ReturnType<typeof postgres>;

let storefrontDatabaseClient: StorefrontDatabaseClient | undefined;

export function getStorefrontDatabaseClient(): StorefrontDatabaseClient {
  storefrontDatabaseClient ??= postgres(getStorefrontDatabaseUrl(), {
    ssl: "require",
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 10,
  });

  return storefrontDatabaseClient;
}
