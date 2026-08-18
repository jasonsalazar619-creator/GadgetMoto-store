create or replace view storefront.catalog_products
with (security_barrier = true)
as
select
  products.id as product_id,
  products.slug as product_slug,
  products.name as product_name,
  brands.name as brand_name,
  brands.slug as brand_slug,
  products.category as category,
  products.sort_order as product_sort_order,
  variants.id as variant_id,
  variants.sku as sku,
  variants.variant_name as variant_name,
  variants.ram_gb as ram_gb,
  variants.storage_gb as storage_gb,
  variants.condition as condition,
  variants.current_price_centavos as current_price_centavos,
  variants.srp_centavos as srp_centavos,
  variants.badge as badge,
  variants.financing_available as financing_available,
  products.short_description as short_description,
  products.full_description as full_description,
  primary_image.storage_path as primary_image_path,
  primary_image.alt_text as primary_image_alt,
  variants.extended_ram_gb as extended_ram_gb,
  products.specifications as specifications,
  coalesce(product_images.items, '[]'::jsonb) as images,
  variants.sort_order as variant_sort_order
from public.products as products
inner join public.brands as brands
  on products.brand_id = brands.id
inner join public.product_variants as variants
  on variants.product_id = products.id
left join lateral (
  select
    images.storage_path,
    images.alt_text
  from public.product_images as images
  where images.product_id = products.id
    and images.is_published is true
    and images.media_type = 'image'::public.product_media_type
  order by images.is_primary desc, images.sort_order asc, images.id asc
  limit 1
) as primary_image on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'storagePath', images.storage_path,
      'altText', images.alt_text,
      'sortOrder', images.sort_order,
      'isPrimary', images.is_primary
    )
    order by images.is_primary desc, images.sort_order asc, images.id asc
  ) as items
  from public.product_images as images
  where images.product_id = products.id
    and images.is_published is true
    and images.media_type = 'image'::public.product_media_type
) as product_images on true
where brands.is_active is true
  and products.status = 'active'::public.product_status
  and products.is_public_preview is false
  and products.archived_at is null
  and products.published_at is not null
  and products.published_at <= current_timestamp
  and variants.is_active is true;

comment on view storefront.catalog_products is
  'Reviewed server-only purchasable catalog projection. variant_sort_order provides deterministic administrator-controlled default configuration ordering; no write path or private draft fields.';
