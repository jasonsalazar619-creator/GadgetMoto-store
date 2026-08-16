-- Let active administrators change or remove a product's primary image while
-- preserving the one-primary-image constraint atomically. Existing product-
-- image RLS, grants, and audit triggers remain the authorization and audit
-- boundaries for every row mutation.

create function public.set_product_primary_image(
  target_product_id uuid,
  target_image_id uuid
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_is_published boolean;
begin
  if auth.uid() is null
    or not (select public.is_active_administrator()) then
    return 'FORBIDDEN';
  end if;

  perform 1
  from public.products
  where id = target_product_id
  for update;

  if not found then
    return 'NOT_FOUND';
  end if;

  select images.is_published
  into target_is_published
  from public.product_images as images
  where images.id = target_image_id
    and images.product_id = target_product_id
    and images.variant_id is null
    and images.media_type = 'image'::public.product_media_type
  for update;

  if not found then
    return 'NOT_FOUND';
  end if;

  if target_is_published is not true then
    return 'NOT_PUBLISHED';
  end if;

  update public.product_images
  set is_primary = false
  where product_id = target_product_id
    and id <> target_image_id
    and is_primary is true;

  update public.product_images
  set is_primary = true
  where id = target_image_id
    and product_id = target_product_id;

  return 'UPDATED';
end;
$$;

comment on function public.set_product_primary_image(uuid, uuid) is
  'Atomically selects one published product image as primary for an authenticated active administrator.';

revoke execute on function public.set_product_primary_image(uuid, uuid)
  from public, anon;
grant execute on function public.set_product_primary_image(uuid, uuid)
  to authenticated;

create function public.delete_product_image_with_replacement(
  target_product_id uuid,
  target_image_id uuid
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_is_primary boolean;
  replacement_image_id uuid;
begin
  if auth.uid() is null
    or not (select public.is_active_administrator()) then
    return 'FORBIDDEN';
  end if;

  perform 1
  from public.products
  where id = target_product_id
  for update;

  if not found then
    return 'NOT_FOUND';
  end if;

  select images.is_primary
  into target_is_primary
  from public.product_images as images
  where images.id = target_image_id
    and images.product_id = target_product_id
    and images.variant_id is null
    and images.media_type = 'image'::public.product_media_type
  for update;

  if not found then
    return 'NOT_FOUND';
  end if;

  if target_is_primary then
    select images.id
    into replacement_image_id
    from public.product_images as images
    where images.product_id = target_product_id
      and images.id <> target_image_id
      and images.variant_id is null
      and images.media_type = 'image'::public.product_media_type
      and images.is_published is true
    order by images.sort_order asc, images.id asc
    limit 1
    for update;
  end if;

  delete from public.product_images
  where id = target_image_id
    and product_id = target_product_id;

  if target_is_primary and replacement_image_id is not null then
    update public.product_images
    set is_primary = true
    where id = replacement_image_id
      and product_id = target_product_id;
  end if;

  return 'DELETED';
end;
$$;

comment on function public.delete_product_image_with_replacement(uuid, uuid) is
  'Atomically removes one product image and promotes the next published image when the removed image was primary.';

revoke execute on function public.delete_product_image_with_replacement(uuid, uuid)
  from public, anon;
grant execute on function public.delete_product_image_with_replacement(uuid, uuid)
  to authenticated;
