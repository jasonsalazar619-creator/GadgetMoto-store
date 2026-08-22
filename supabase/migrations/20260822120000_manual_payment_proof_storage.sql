insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy payment_proofs_admin_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (select public.is_active_administrator())
  );

create policy payments_order_service_update_proof
  on public.payments
  for update
  to gadgetmoto_order_service
  using (
    method = 'maya_manual'::public.payment_method
    and status <> 'paid'::public.payment_status
  )
  with check (
    method = 'maya_manual'::public.payment_method
    and proof_storage_path is not null
    and status = 'awaiting_payment'::public.payment_status
  );

grant update (proof_storage_path, status)
  on table public.payments
  to gadgetmoto_order_service;

comment on column public.payments.proof_storage_path is
  'Private payment-proofs Storage object path. Customer uploads use a trusted server route, never a public bucket or browser database write.';
