import "server-only";

import postgres from "postgres";

import { getOrderDatabaseUrl } from "./config";

export type OrderDatabaseClient = ReturnType<typeof postgres>;

let orderDatabaseClient: OrderDatabaseClient | undefined;

export function getOrderDatabaseClient(): OrderDatabaseClient {
  orderDatabaseClient ??= postgres(getOrderDatabaseUrl(), {
    ssl: "require",
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 10,
  });

  return orderDatabaseClient;
}
