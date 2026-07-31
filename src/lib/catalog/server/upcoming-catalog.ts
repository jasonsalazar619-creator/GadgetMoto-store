import "server-only";

import { cache } from "react";
import {
  upcomingProducts as staticUpcomingProducts,
  type UpcomingProduct,
} from "@/data/upcoming-products";
import {
  CatalogServerError,
  sanitizeCatalogServerError,
} from "./catalog-error";
import { getCatalogSourceMode } from "./config";
import { loadDatabaseUpcomingRows } from "./database-upcoming-catalog";
import { normalizeDatabaseUpcomingRows } from "./upcoming-validation";

async function loadUpcomingProducts(): Promise<
  readonly UpcomingProduct[]
> {
  let mode;

  try {
    mode = getCatalogSourceMode();
  } catch {
    throw new CatalogServerError("CATALOG_CONFIGURATION_INVALID");
  }

  if (mode === "static") return staticUpcomingProducts;

  try {
    return normalizeDatabaseUpcomingRows(await loadDatabaseUpcomingRows());
  } catch (error) {
    const catalogError = sanitizeCatalogServerError(error);
    if (mode === "database") throw catalogError;

    console.warn(
      `[GadgetMoTo preview fallback] ${catalogError.code}: ${catalogError.message}`,
    );
    return staticUpcomingProducts;
  }
}

export const getUpcomingProducts = cache(loadUpcomingProducts);

export async function getUpcomingProductBySlug(
  slug: string,
): Promise<UpcomingProduct | undefined> {
  return (await getUpcomingProducts()).find((product) => product.id === slug);
}
