import "server-only";

const catalogSourceModes = [
  "static",
  "database",
  "database-with-static-fallback",
] as const;

export type CatalogSourceMode = (typeof catalogSourceModes)[number];

export type CatalogConfigurationStatus = Readonly<{
  mode: CatalogSourceMode;
  databaseConfigured: boolean;
}>;

const isCatalogSourceMode = (value: string): value is CatalogSourceMode =>
  catalogSourceModes.some((mode) => mode === value);

export function getCatalogSourceMode(): CatalogSourceMode {
  const configuredMode = process.env.CATALOG_SOURCE?.trim();

  if (!configuredMode) return "static";

  if (!isCatalogSourceMode(configuredMode)) {
    throw new Error(
      'Invalid CATALOG_SOURCE. Expected "static", "database", or "database-with-static-fallback".',
    );
  }

  return configuredMode;
}

export function getStorefrontDatabaseUrl(): string {
  const databaseUrl = process.env.STOREFRONT_DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "STOREFRONT_DATABASE_URL is required for catalog database access.",
    );
  }

  return databaseUrl;
}

export function getCatalogConfigurationStatus(): CatalogConfigurationStatus {
  return {
    mode: getCatalogSourceMode(),
    databaseConfigured: Boolean(
      process.env.STOREFRONT_DATABASE_URL?.trim(),
    ),
  };
}
