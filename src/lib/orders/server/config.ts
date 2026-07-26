import "server-only";

import { OrderServerError } from "./order-error";

export type OrderConfigurationStatus = Readonly<{
  databaseConfigured: boolean;
}>;

export function getOrderDatabaseUrl(): string {
  const databaseUrl = process.env.ORDER_DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new OrderServerError("ORDER_DATABASE_NOT_CONFIGURED");
  }

  return databaseUrl;
}

export function getOrderConfigurationStatus(): OrderConfigurationStatus {
  return {
    databaseConfigured: Boolean(process.env.ORDER_DATABASE_URL?.trim()),
  };
}
