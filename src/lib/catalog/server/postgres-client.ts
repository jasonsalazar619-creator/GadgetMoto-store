import "server-only";

import postgres from "postgres";

import { getStorefrontDatabaseUrl } from "./config";

type StorefrontDatabaseClient = ReturnType<typeof postgres>;

let storefrontDatabaseClient: StorefrontDatabaseClient | undefined;

export function getStorefrontDatabaseClient(): StorefrontDatabaseClient {
  storefrontDatabaseClient ??= postgres(getStorefrontDatabaseUrl());

  return storefrontDatabaseClient;
}
