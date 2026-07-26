import "server-only";

import { cache } from "react";
import {
  getAllProducts,
  type PrototypeProduct,
} from "@/data/prototype-products";
import {
  CatalogServerError,
  sanitizeCatalogServerError,
} from "./catalog-error";
import { normalizeDatabaseCatalogRows } from "./catalog-validation";
import { getCatalogSourceMode } from "./config";
import { loadDatabaseCatalogRows } from "./database-catalog";

async function loadCatalogProducts(): Promise<
  readonly PrototypeProduct[]
> {
  let mode;

  try {
    mode = getCatalogSourceMode();
  } catch {
    throw new CatalogServerError("CATALOG_CONFIGURATION_INVALID");
  }

  if (mode === "static") return getAllProducts();

  try {
    const rows = await loadDatabaseCatalogRows();
    return normalizeDatabaseCatalogRows(rows);
  } catch (error) {
    const catalogError = sanitizeCatalogServerError(error);

    if (mode === "database") throw catalogError;

    console.warn(
      `[GadgetMoTo catalog fallback] ${catalogError.code}: ${catalogError.message}`,
    );
    return getAllProducts();
  }
}

export const getCatalogProducts = cache(loadCatalogProducts);

export async function getCatalogProductBySlug(
  slug: string,
): Promise<PrototypeProduct | undefined> {
  const products = await getCatalogProducts();
  return products.find((product) => product.slug === slug);
}
