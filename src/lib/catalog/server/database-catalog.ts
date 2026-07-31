import "server-only";

import { CatalogServerError } from "./catalog-error";
import { getStorefrontDatabaseClient } from "./postgres-client";

export type CatalogDatabaseRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  brand_name: string;
  brand_slug: string;
  category: string;
  product_sort_order: number;
  variant_id: string;
  sku: string;
  variant_name: string;
  ram_gb: number | null;
  storage_gb: number;
  condition: string;
  current_price_centavos: string | number;
  srp_centavos: string | number | null;
  badge: string | null;
  financing_available: boolean;
  short_description: string | null;
  full_description: string | null;
  primary_image_path: string | null;
  primary_image_alt: string | null;
};

export async function loadDatabaseCatalogRows(): Promise<
  readonly CatalogDatabaseRow[]
> {
  try {
    const sql = getStorefrontDatabaseClient();
    const rows = await sql<CatalogDatabaseRow[]>`
      select
        product_id,
        product_slug,
        product_name,
        brand_name,
        brand_slug,
        category,
        product_sort_order,
        variant_id,
        sku,
        variant_name,
        ram_gb,
        storage_gb,
        condition,
        current_price_centavos,
        srp_centavos,
        badge,
        financing_available,
        short_description,
        full_description,
        primary_image_path,
        primary_image_alt
      from storefront.catalog_products
      order by product_sort_order asc, product_slug asc, sku asc
    `;

    return rows;
  } catch {
    throw new CatalogServerError("CATALOG_DATABASE_QUERY_FAILED");
  }
}
