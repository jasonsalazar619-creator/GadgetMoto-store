import "server-only";

import { OrderServerError } from "./order-error";

export type OrderConfigurationStatus = Readonly<{
  databaseConfigured: boolean;
  onlineOrderingEnabled: boolean;
  paymentGatewayEnabled: boolean;
  manualPaymentModeEnabled: boolean;
}>;

export function isOnlineOrderingEnabled(): boolean {
  const configuredValue = process.env.ONLINE_ORDERING_ENABLED?.trim();
  if (configuredValue === "0") return false;
  if (!process.env.ORDER_DATABASE_URL?.trim()) return false;
  if (configuredValue === "1") return true;

  return isManualPaymentModeEnabled();
}

export function isPaymentGatewayEnabled(): boolean {
  return process.env.PAYMENT_GATEWAY_ENABLED?.trim() === "1";
}

export function isManualPaymentModeEnabled(): boolean {
  return !isPaymentGatewayEnabled();
}

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
    onlineOrderingEnabled: isOnlineOrderingEnabled(),
    paymentGatewayEnabled: isPaymentGatewayEnabled(),
    manualPaymentModeEnabled: isManualPaymentModeEnabled(),
  };
}
