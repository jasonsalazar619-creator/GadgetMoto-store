-- Correct physical-RAM presentation for two existing catalog variants.
-- Canonical SKUs remain unchanged opaque identifiers.

do $$
declare
  matched_variant_count integer;
  infinix_updated_count integer;
  tecno_updated_count integer;
begin
  select count(*)
  into matched_variant_count
  from public.product_variants
  where sku in (
    'GMT-INF-PH-N60P5G-16-256',
    'GMT-TEC-PH-CAMON50-16-256'
  );

  if matched_variant_count <> 2 then
    raise exception
      'Physical-RAM correction expected exactly two canonical SKUs.';
  end if;

  update public.product_variants
  set
    ram_gb = 8,
    variant_name = '8GB RAM + 8GB Extended / 256GB'
  where sku = 'GMT-INF-PH-N60P5G-16-256';

  get diagnostics infinix_updated_count = row_count;

  if infinix_updated_count <> 1 then
    raise exception
      'Infinix physical-RAM correction expected exactly one variant.';
  end if;

  update public.product_variants
  set
    ram_gb = 8,
    variant_name = '8GB RAM + 8GB Extended / 256GB'
  where sku = 'GMT-TEC-PH-CAMON50-16-256';

  get diagnostics tecno_updated_count = row_count;

  if tecno_updated_count <> 1 then
    raise exception
      'TECNO physical-RAM correction expected exactly one variant.';
  end if;

  if exists (
    select 1
    from public.product_variants
    where sku in (
      'GMT-INF-PH-N60P5G-16-256',
      'GMT-TEC-PH-CAMON50-16-256'
    )
      and (
        ram_gb <> 8
        or variant_name <> '8GB RAM + 8GB Extended / 256GB'
        or storage_gb <> 256
      )
  ) then
    raise exception
      'Physical-RAM correction failed its post-update validation.';
  end if;
end;
$$ language plpgsql;
