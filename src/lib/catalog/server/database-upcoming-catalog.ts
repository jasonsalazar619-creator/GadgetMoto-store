import "server-only";

import { CatalogServerError } from "./catalog-error";
import { getStorefrontDatabaseClient } from "./postgres-client";

export type UpcomingDatabaseRow = {
  product_slug: string;
  product_name: string;
  brand_name: string;
  brand_slug: string;
  category: string | null;
  short_description: string;
  full_description: string;
  highlights: unknown;
  specifications: unknown;
  product_sort_order: number;
  images: unknown;
};

export async function loadDatabaseUpcomingRows(): Promise<
  readonly UpcomingDatabaseRow[]
> {
  try {
    const sql = getStorefrontDatabaseClient();
    return await sql<UpcomingDatabaseRow[]>`
      select
        product_slug,
        product_name,
        brand_name,
        brand_slug,
        category,
        short_description,
        full_description,
        highlights,
        specifications,
        product_sort_order,
        images
      from storefront.coming_soon_products
      order by product_sort_order asc, product_slug asc
    `;
  } catch {
    throw new CatalogServerError("CATALOG_DATABASE_QUERY_FAILED");
  }
}
