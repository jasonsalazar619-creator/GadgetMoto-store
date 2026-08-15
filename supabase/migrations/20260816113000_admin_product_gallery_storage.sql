-- Allow active administrators to preview and safely remove managed product
-- images from the existing private bucket. Public reads remain limited by the
-- previously deployed published-product policy.

create policy product_images_administrator_read
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'product-images'
    and (select public.is_active_administrator())
    and (select public.is_valid_product_image_storage_path(name))
  );
