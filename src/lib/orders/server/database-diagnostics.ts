import "server-only";

type ManualPaymentDatabaseOperation =
  | "admin_authorization"
  | "payment_review_rpc"
  | "payment_review_details"
  | "payment_review_result"
  | "order_creation";

type ErrorLike = Readonly<{
  code?: unknown;
  name?: unknown;
}>;

const safeTokenPattern = /^[A-Za-z0-9_]{1,40}$/;

const readSafeToken = (
  value: unknown,
  fallback: string,
): string =>
  typeof value === "string" && safeTokenPattern.test(value)
    ? value
    : fallback;

const getSafeMessage = (code: string): string => {
  if (code === "42501") return "permission_denied";
  if (code === "42P01") return "missing_relation";
  if (code === "42883" || code === "PGRST202") {
    return "missing_function";
  }
  if (code === "42P05" || code === "26000") {
    return "prepared_statement_incompatible";
  }
  if (
    code.startsWith("08") ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT"
  ) {
    return "connection_failed";
  }
  if (code === "ORDER_DATABASE_NOT_CONFIGURED") {
    return "configuration_missing";
  }
  if (code.startsWith("AUTH_") || code.startsWith("ADMIN_")) {
    return "authorization_failed";
  }
  if (code === "INVALID_DATABASE_RESULT") {
    return "invalid_database_result";
  }
  return "database_operation_failed";
};

export function logManualPaymentDatabaseFailure(
  operation: ManualPaymentDatabaseOperation,
  error: unknown,
): void {
  const errorLike =
    typeof error === "object" && error !== null
      ? (error as ErrorLike)
      : undefined;
  const code = readSafeToken(
    errorLike?.code,
    "UNCLASSIFIED_DATABASE_ERROR",
  );
  const errorClass = readSafeToken(
    errorLike?.name ??
      (errorLike?.constructor as { name?: unknown } | undefined)?.name,
    "DatabaseError",
  );

  console.error(`[manual-payment-db] ${operation} failed`, {
    code,
    errorClass,
    message: getSafeMessage(code),
  });
}

export function logManualPaymentReadinessCode(
  operation: ManualPaymentDatabaseOperation,
  code: string,
): void {
  const safeCode = readSafeToken(code, "UNCLASSIFIED_DATABASE_ERROR");
  console.error(`[manual-payment-db] ${operation} failed`, {
    code: safeCode,
    errorClass: "ReadinessError",
    message: getSafeMessage(safeCode),
  });
}
