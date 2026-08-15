create function public.approve_manual_payment_with_confirmed_amounts(
  target_payment_id uuid,
  target_delivery_fee_centavos bigint,
  target_vat_rate_bps integer,
  target_vat_amount_centavos bigint,
  target_payment_amount_centavos bigint
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor_id uuid := auth.uid();
  current_payment_status public.payment_status;
  current_payment_method public.payment_method;
  current_payment_amount bigint;
  target_order_id uuid;
  current_order_status public.order_status;
  current_merchandise_subtotal bigint;
  current_final_total bigint;
  confirmed_final_total bigint;
begin
  if actor_id is null
    or not (select public.is_active_administrator()) then
    raise exception using
      errcode = '42501',
      message = 'Administrator payment approval is unavailable.';
  end if;

  if target_payment_id is null
    or target_delivery_fee_centavos is null
    or target_delivery_fee_centavos < 0
    or target_vat_rate_bps is null
    or target_vat_rate_bps not between 0 and 10000
    or target_vat_amount_centavos is null
    or target_vat_amount_centavos < 0
    or target_payment_amount_centavos is null
    or target_payment_amount_centavos < 0 then
    raise exception using
      errcode = '22023',
      message = 'Invalid confirmed manual payment amounts.';
  end if;

  select
    payments.status,
    payments.method,
    payments.amount_centavos,
    orders.id,
    orders.status,
    orders.merchandise_subtotal_centavos,
    orders.final_total_centavos
  into
    current_payment_status,
    current_payment_method,
    current_payment_amount,
    target_order_id,
    current_order_status,
    current_merchandise_subtotal,
    current_final_total
  from public.payments as payments
  inner join public.orders as orders on orders.id = payments.order_id
  where payments.id = target_payment_id
  for update of payments, orders;

  if target_order_id is null
    or current_payment_method = 'maya_online'::public.payment_method then
    raise exception using
      errcode = 'P0002',
      message = 'Manual payment record was not found.';
  end if;

  if current_order_status in (
    'paid'::public.order_status,
    'processing'::public.order_status,
    'ready_for_pickup'::public.order_status,
    'shipped'::public.order_status,
    'completed'::public.order_status,
    'cancelled'::public.order_status
  ) then
    raise exception using
      errcode = '55000',
      message = 'This order cannot accept a manual payment approval.';
  end if;

  if current_payment_status not in (
    'pending'::public.payment_status,
    'instructions_pending'::public.payment_status,
    'awaiting_payment'::public.payment_status,
    'failed'::public.payment_status
  ) then
    raise exception using
      errcode = '55000',
      message = 'This payment cannot accept a manual payment approval.';
  end if;

  confirmed_final_total := current_merchandise_subtotal
    + target_delivery_fee_centavos
    + target_vat_amount_centavos;

  if target_payment_amount_centavos <> confirmed_final_total then
    raise exception using
      errcode = '23514',
      message = 'The recorded payment must match the confirmed order total.';
  end if;

  update public.orders
  set
    vat_rate_bps = target_vat_rate_bps,
    vat_amount_centavos = target_vat_amount_centavos,
    delivery_fee_centavos = target_delivery_fee_centavos,
    final_total_centavos = confirmed_final_total,
    status = 'paid'::public.order_status,
    reviewed_by = actor_id,
    reviewed_at = coalesce(reviewed_at, current_timestamp),
    confirmed_at = coalesce(confirmed_at, current_timestamp)
  where id = target_order_id;

  update public.payments
  set
    amount_centavos = target_payment_amount_centavos,
    status = 'paid'::public.payment_status,
    verified_by = actor_id,
    verified_at = current_timestamp
  where id = target_payment_id;

  insert into public.payment_events (
    payment_id,
    event_type,
    payload
  )
  values (
    target_payment_id,
    'manual_payment_confirmed',
    jsonb_build_object(
      'previous_status', current_payment_status,
      'new_status', 'paid',
      'confirmed_total_centavos', confirmed_final_total,
      'source', 'authenticated_administrator'
    )
  );

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data
  )
  values (
    actor_id,
    'payment.manual_payment_confirmed',
    'payment',
    target_payment_id,
    jsonb_build_object(
      'payment_status', current_payment_status,
      'payment_amount_centavos', current_payment_amount,
      'final_total_centavos', current_final_total
    ),
    jsonb_build_object(
      'payment_status', 'paid',
      'payment_amount_centavos', target_payment_amount_centavos,
      'final_total_centavos', confirmed_final_total,
      'delivery_fee_centavos', target_delivery_fee_centavos,
      'vat_rate_bps', target_vat_rate_bps,
      'vat_amount_centavos', target_vat_amount_centavos
    )
  );

  return true;
end;
$$;

comment on function public.approve_manual_payment_with_confirmed_amounts(
  uuid,
  bigint,
  integer,
  bigint,
  bigint
) is
  'Allows only an authenticated active administrator to atomically record confirmed order amounts and approve a matching manual payment with event and audit history.';

revoke execute on function public.approve_manual_payment_with_confirmed_amounts(
  uuid,
  bigint,
  integer,
  bigint,
  bigint
) from public, anon, authenticated;

grant execute on function public.approve_manual_payment_with_confirmed_amounts(
  uuid,
  bigint,
  integer,
  bigint,
  bigint
) to authenticated;
