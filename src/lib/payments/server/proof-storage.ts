import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const paymentProofBucket = "payment-proofs";

type PaymentProofStorageConfig = Readonly<{
  url: string;
  secretKey: string;
}>;

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function getPaymentProofStorageConfig(): PaymentProofStorageConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey || !isHttpsUrl(url)) return null;
  return { url, secretKey };
}

export function getPaymentProofStorageClient(): SupabaseClient<Database> | null {
  const config = getPaymentProofStorageConfig();
  if (!config) return null;

  return createClient<Database>(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
