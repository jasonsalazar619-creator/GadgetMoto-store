-- Explicit UUID map (brands):
-- 10000000-0000-4000-8000-000000000001 Xiaomi
-- 10000000-0000-4000-8000-000000000002 Apple
-- 10000000-0000-4000-8000-000000000003 POCO
-- 10000000-0000-4000-8000-000000000004 Redmi
-- 10000000-0000-4000-8000-000000000005 Infinix
-- 10000000-0000-4000-8000-000000000006 TECNO
--
-- Explicit UUID map (products and matching variants):
-- 001 / 001 Xiaomi 17 Ultra 5G Leica Kit
-- 002 / 002 Apple iPhone 17
-- 003 / 003 POCO F8 Ultra
-- 004 / 004 Redmi Note 15 Pro Plus 5G
-- 005 / 005 Redmi Turbo 5
-- 006 / 006 Infinix Note 60 Pro 5G
-- 007 / 007 TECNO Camon 50
-- 008 / 008 POCO C85
-- 009 / 009 POCO Pad X1
-- 010 / 010 Xiaomi Pad 8
-- 011 / 011 Redmi Pad 2 Pro 5G
-- 012 / 012 TECNO Mega Pad Pro

insert into public.brands (
  id,
  name,
  slug,
  description,
  is_active,
  sort_order
)
values
  ('10000000-0000-4000-8000-000000000001', 'Xiaomi', 'xiaomi', null, true, 0),
  ('10000000-0000-4000-8000-000000000002', 'Apple', 'apple', null, true, 1),
  ('10000000-0000-4000-8000-000000000003', 'POCO', 'poco', null, true, 2),
  ('10000000-0000-4000-8000-000000000004', 'Redmi', 'redmi', null, true, 3),
  ('10000000-0000-4000-8000-000000000005', 'Infinix', 'infinix', null, true, 4),
  ('10000000-0000-4000-8000-000000000006', 'TECNO', 'tecno', null, true, 5);

insert into public.products (
  id,
  brand_id,
  name,
  slug,
  category,
  short_description,
  status,
  is_featured,
  published_at
)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Xiaomi 17 Ultra 5G Leica Kit', 'xiaomi-17-ultra-5g-leica-kit', 'phone', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Apple iPhone 17', 'apple-iphone-17', 'phone', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'POCO F8 Ultra', 'poco-f8-ultra', 'phone', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'Redmi Note 15 Pro Plus 5G', 'redmi-note-15-pro-plus-5g', 'phone', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', 'Redmi Turbo 5', 'redmi-turbo-5', 'phone', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', 'Infinix Note 60 Pro 5G', 'infinix-note-60-pro-5g', 'phone', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000006', 'TECNO Camon 50', 'tecno-camon-50', 'phone', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'POCO C85', 'poco-c85', 'phone', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'POCO Pad X1', 'poco-pad-x1', 'tablet', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', 'Xiaomi Pad 8', 'xiaomi-pad-8', 'tablet', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000004', 'Redmi Pad 2 Pro 5G', 'redmi-pad-2-pro-5g', 'tablet', null, 'active', false, timestamptz '2026-07-17 20:51:11+00'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000006', 'TECNO Mega Pad Pro', 'tecno-mega-pad-pro', 'tablet', null, 'active', false, timestamptz '2026-07-17 20:51:11+00');

insert into public.product_variants (
  id,
  product_id,
  sku,
  variant_name,
  ram_gb,
  storage_gb,
  condition,
  current_price_centavos,
  srp_centavos,
  badge,
  financing_available,
  is_active,
  sort_order
)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'GMT-XIA-PH-17ULTRA-16-512', '16GB/512GB', 16, 512, 'brand_new', 8499000, 8999000, 'sale', true, true, 0),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'GMT-APL-PH-IP17-256', '256GB', null, 256, 'brand_new', 5799000, null, 'new', true, true, 0),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'GMT-POC-PH-F8ULTRA-16-512', '16GB/512GB', 16, 512, 'brand_new', 4699000, null, 'new', true, true, 0),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'GMT-RED-PH-N15PP5G-12-512', '12GB/512GB', 12, 512, 'brand_new', 2799000, 2899000, 'sale', true, true, 0),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000005', 'GMT-RED-PH-TURBO5-12-256', '12GB/256GB', 12, 256, 'brand_new', 2099000, 2299000, 'sale', true, true, 0),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000006', 'GMT-INF-PH-N60P5G-16-256', '16GB/256GB', 16, 256, 'brand_new', 1999000, 2099000, 'sale', true, true, 0),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000007', 'GMT-TEC-PH-CAMON50-16-256', '16GB/256GB', 16, 256, 'brand_new', 1349000, 1399000, 'sale', true, true, 0),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000008', 'GMT-POC-PH-C85-8-256', '8GB/256GB', 8, 256, 'brand_new', 799000, 899000, 'sale', true, true, 0),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000009', 'GMT-POC-TB-PADX1-8-512', '8GB/512GB', 8, 512, 'brand_new', 2399000, 2499000, 'sale', true, true, 0),
  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000010', 'GMT-XIA-TB-PAD8-8-128', '8GB/128GB', 8, 128, 'brand_new', 1999000, 2099000, 'sale', true, true, 0),
  ('30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000011', 'GMT-RED-TB-PAD2PRO5G-8-256', '8GB/256GB', 8, 256, 'brand_new', 1899000, 1999000, 'sale', true, true, 0),
  ('30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000012', 'GMT-TEC-TB-MEGAPADPRO-8-256', '8GB/256GB', 8, 256, 'brand_new', 1399000, 1499000, 'sale', true, true, 0);
