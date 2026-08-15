import { isManagedProductImagePath } from "@/lib/catalog/product-image-source";
import { createClient } from "@/lib/supabase/server";

const notFound = () => new Response(null, { status: 404 });

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const storagePath = path.join("/");

  if (!isManagedProductImagePath(storagePath)) return notFound();

  const supabase = await createClient();
  if (!supabase) return notFound();

  const { data, error } = await supabase.storage
    .from("product-images")
    .download(storagePath);

  if (error || !data) return notFound();

  return new Response(data, {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Type": data.type || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
