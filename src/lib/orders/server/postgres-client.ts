import "server-only";

import postgres from "postgres";

import { getOrderDatabaseUrl } from "./config";

export type OrderDatabaseClient = ReturnType<typeof postgres>;

let orderDatabaseClient: OrderDatabaseClient | undefined;

export function getOrderDatabaseClient(): OrderDatabaseClient {
  orderDatabaseClient ??= postgres(getOrderDatabaseUrl());

  return orderDatabaseClient;
}
