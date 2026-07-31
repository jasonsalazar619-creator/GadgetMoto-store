import "server-only";

import { cache } from "react";
import { requireAuthenticatedAdmin } from "@/lib/admin/server/auth";
import { createClient } from "@/lib/supabase/server";

export type AdminCatalogSummary = {
  total: number;
  active: number;
  comingSoon: number;
  draft: number;
  archived: number;
};

export const getAdminCatalogSummary = cache(
  async (): Promise<AdminCatalogSummary | null> => {
    await requireAuthenticatedAdmin();
    const supabase = await createClient();

    if (!supabase) {
      return null;
    }

    const results = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft")
        .eq("is_public_preview", true),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft")
        .eq("is_public_preview", false),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "archived"),
    ]);

    const [total, active, comingSoon, draft, archived] = results;

    if (
      total.error ||
      active.error ||
      comingSoon.error ||
      draft.error ||
      archived.error ||
      total.count === null ||
      active.count === null ||
      comingSoon.count === null ||
      draft.count === null ||
      archived.count === null
    ) {
      return null;
    }

    return {
      total: total.count,
      active: active.count,
      comingSoon: comingSoon.count,
      draft: draft.count,
      archived: archived.count,
    };
  },
);
