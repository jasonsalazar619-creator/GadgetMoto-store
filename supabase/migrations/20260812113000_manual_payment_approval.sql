create function public.get_manual_payment_reviews()
returns table (
  payment_id uuid,
  public_order_number text,
  customer_full_name text,
  customer_mobile text,
  customer_email text,
  order_status public.order_status,
  payment_method public.payment_method,
  payment_status public.payment_status,
  merchandise_subtotal_centavos bigint,
  final_total_centavos bigint,
  payment_amount_centavos bigint,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
begin
  if (select auth.uid()) is null
    or not (select public.is_active_administrator()) then
    raise exception using
      errcode = '42501',
      message = 'Administrator payment review is unavailable.';
  end if;

  return query
  select
    payments.id,
    orders.public_order_number,
    orders.customer_full_name,
    orders.customer_mobile,
    orders.customer_email,
    orders.status,
    payments.method,
    payments.status,
    orders.merchandise_subtotal_centavos,
    orders.final_total_centavos,
    payments.amount_centavos,
    orders.created_at
  from public.payments as payments
  inner join public.orders as orders on orders.id = payments.order_id
  where payments.method in (
    'maya_manual'::public.payment_method,
    'gcash'::public.payment_method,
    'bank_transfer'::public.payment_method,
    'cash_on_pickup'::public.payment_method
  )
  order by orders.created_at desc, payments.id desc
  limit 100;
end;
$$;

comment on function public.get_manual_payment_reviews() is
  'Returns a limited manual-payment review queue only to the authenticated active administrator. Direct order and payment table access remains closed.';

revoke execute on function public.get_manual_payment_reviews()
  from public, anon, authenticated;
grant execute on function public.get_manual_payment_reviews()
  to authenticated;

create function public.set_manual_payment_status(
  target_payment_id uuid,
  target_status public.payment_status
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
  current_final_total bigint;
begin
  if actor_id is null
    or not (select public.is_active_administrator()) then
    raise exception using
      errcode = '42501',
      message = 'Administrator payment approval is unavailable.';
  end if;

  if target_payment_id is null
    or target_status not in (
      'paid'::public.payment_status,
      'failed'::public.payment_status
    ) then
    raise exception using
      errcode = '22023',
      message = 'Invalid manual payment update.';
  end if;

  select
    payments.status,
    payments.method,
    payments.amount_centavos,
    orders.id,
    orders.status,
    orders.final_total_centavos
  into
    current_payment_status,
    current_payment_method,
    current_payment_amount,
    target_order_id,
    current_order_status,
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
      message = 'This order cannot accept a manual payment update.';
  end if;

  if current_payment_status not in (
    'pending'::public.payment_status,
    'instructions_pending'::public.payment_status,
    'awaiting_payment'::public.payment_status,
    'failed'::public.payment_status
  ) then
    raise exception using
      errcode = '55000',
      message = 'This payment cannot accept a manual status update.';
  end if;

  if current_payment_status = target_status then
    raise exception using
      errcode = '55000',
      message = 'This payment already has the requested status.';
  end if;

  if target_status = 'paid'::public.payment_status
    and (
      current_final_total is null
      or current_payment_amount is null
      or current_payment_amount <> current_final_total
    ) then
    raise exception using
      errcode = '23514',
      message = 'The confirmed order and payment amounts must match before approval.';
  end if;

  update public.payments
  set
    status = target_status,
    verified_by = actor_id,
    verified_at = current_timestamp
  where id = target_payment_id;

  if target_status = 'paid'::public.payment_status then
    update public.orders
    set
      status = 'paid'::public.order_status,
      reviewed_by = actor_id,
      reviewed_at = coalesce(reviewed_at, current_timestamp),
      confirmed_at = coalesce(confirmed_at, current_timestamp)
    where id = target_order_id;
  end if;

  insert into public.payment_events (
    payment_id,
    event_type,
    payload
  )
  values (
    target_payment_id,
    'manual_payment_status_changed',
    jsonb_build_object(
      'previous_status', current_payment_status,
      'new_status', target_status,
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
    'payment.manual_status_changed',
    'payment',
    target_payment_id,
    jsonb_build_object('status', current_payment_status),
    jsonb_build_object('status', target_status)
  );

  return true;
end;
$$;

comment on function public.set_manual_payment_status(uuid, public.payment_status) is
  'Allows only the authenticated active administrator to record a limited manual payment decision, with amount integrity, payment-event history, and append-only audit logging.';

revoke execute on function public.set_manual_payment_status(uuid, public.payment_status)
  from public, anon, authenticated;
grant execute on function public.set_manual_payment_status(uuid, public.payment_status)
  to authenticated;

-- Automated gateway processing remains disabled in application configuration.
-- Re-enabling it later requires a reviewed server-side provider and webhook flow;
-- a browser redirect must never determine successful payment.
