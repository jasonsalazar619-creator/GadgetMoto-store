alter table public.order_fulfillments
  alter column location_id drop not null;

alter table public.order_fulfillments
  add constraint order_fulfillments_location_required_after_confirmation check (
    location_id is not null
    or status = 'pending_confirmation'::public.fulfillment_status
  );

comment on column public.order_fulfillments.location_id is
  'Nullable only while fulfillment remains pending confirmation and no approved inventory location can be allocated. A location is required before fulfillment advances.';

-- Pending-review guest orders may now be recorded before GadgetMoTo confirms
-- inventory and fulfillment allocation. This migration does not create stock,
-- a store location, a reservation, public data access, or seed data.
