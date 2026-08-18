insert into public.store_locations (
  name,
  slug,
  city,
  province,
  public_address,
  pickup_instructions,
  is_active
)
values (
  'GadgetMoTo Store Pickup',
  'gadgetmoto-dasmarinas-sabang',
  'Dasmariñas',
  'Cavite',
  'LOT 1 DON PLACEDO CAMPUS AVE BRGY SABANG, Dasmariñas, Philippines, 4114',
  null,
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  city = excluded.city,
  province = excluded.province,
  public_address = excluded.public_address,
  pickup_instructions = excluded.pickup_instructions,
  is_active = excluded.is_active;

-- This approved branch record enables store-pickup order review without
-- inventing pickup schedules, instructions, availability, or stock levels.
