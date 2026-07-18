import "server-only";

export type CatalogServerErrorCode =
  | "CATALOG_CONFIGURATION_INVALID"
  | "CATALOG_DATABASE_QUERY_FAILED"
  | "CATALOG_DATABASE_VALIDATION_FAILED";

const catalogErrorMessages: Record<CatalogServerErrorCode, string> = {
  CATALOG_CONFIGURATION_INVALID: "Catalog source configuration is invalid.",
  CATALOG_DATABASE_QUERY_FAILED: "Catalog database query failed.",
  CATALOG_DATABASE_VALIDATION_FAILED: "Catalog database validation failed.",
};

export class CatalogServerError extends Error {
  readonly code: CatalogServerErrorCode;

  constructor(code: CatalogServerErrorCode) {
    super(catalogErrorMessages[code]);
    this.name = "CatalogServerError";
    this.code = code;
  }
}

export function sanitizeCatalogServerError(
  error: unknown,
): CatalogServerError {
  return error instanceof CatalogServerError
    ? error
    : new CatalogServerError("CATALOG_DATABASE_QUERY_FAILED");
}
