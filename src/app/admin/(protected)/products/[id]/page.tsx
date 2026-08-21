import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/product-editor";
import { ManufacturerDataPanel } from "@/components/admin/manufacturer-data-panel";
import { ProductVariantManager } from "@/components/admin/product-variant-manager";
import { getAdminProductEditor } from "@/lib/admin/server/products";
import { isValidUuid } from "@/lib/admin/server/product-validation";

export default async function AdminProductEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidUuid(id)) notFound();

  const data = await getAdminProductEditor(id);
  if (!data) notFound();

  return (
    <>
      <ProductEditor
        brands={data.brands}
        initialProduct={data.product}
        key={data.product.updatedAt}
      />
      <ManufacturerDataPanel product={data.product} />
      <ProductVariantManager product={data.product} />
    </>
  );
}
