import "server-only";

import { createHash } from "node:crypto";
import type postgres from "postgres";

import { getOrderDatabaseClient } from "./postgres-client";
import {
  OrderServerError,
  sanitizeOrderServerError,
} from "./order-error";
import {
  fulfillmentMethods,
  orderStatuses,
  paymentStatuses,
  type CreateOrderNextAction,
  type CreateOrderRequest,
  type CreateOrderSuccessResponse,
  type FulfillmentMethod,
  type OrderStatus,
  type PaymentStatus,
} from "./types";
import { validateCreateOrderRequest } from "./validation";

type OrderTransaction = postgres.TransactionSql;

type SubmissionClaimRow = {
  id: string;
  request_fingerprint: string;
  order_id: string | null;
};

type ExistingOrderRow = {
  public_order_number: string;
  status: string;
  delivery_method: string;
  merchandise_subtotal_centavos: string | number;
  delivery_fee_centavos: string | number | null;
  vat_amount_centavos: string | number | null;
  final_total_centavos: string | number | null;
  payment_status: string | null;
};

type AuthoritativeProductRow = {
  requested_order: number;
  product_id: string;
  product_slug: string;
  product_name: string;
  brand_name: string;
  variant_id: string;
  sku: string;
  variant_name: string;
  current_price_centavos: string | number;
  brand_active: boolean;
  product_active: boolean;
  product_published: boolean;
  variant_active: boolean;
  selected_color_id: string | null;
  selected_color_name: string | null;
  has_active_colors: boolean;
};

type LocationRow = {
  location_id: string;
  location_slug: string;
};

type InventoryLevelRow = {
  variant_id: string;
  location_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
};

type InventoryCoverageRow = {
  level_count: number;
};

type IdentifierRow = {
  id: string;
};

type InsertedOrderRow = IdentifierRow & {
  public_order_number: string;
};

type PreparedOrderItem = Readonly<{
  productId: string;
  productSlug: string;
  productName: string;
  brandName: string;
  variantId: string;
  sku: string;
  variantName: string;
  colorId: string | null;
  colorName: string | null;
  quantity: number;
  unitPriceCentavos: bigint;
  lineTotalCentavos: bigint;
}>;

const postgresBigintMaximum = BigInt("9223372036854775807");

const sha256 = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const readDatabaseBigint = (value: unknown): bigint => {
  let parsed: bigint;

  if (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  ) {
    parsed = BigInt(value);
  } else if (
    typeof value === "string" &&
    /^(0|[1-9][0-9]*)$/.test(value)
  ) {
    parsed = BigInt(value);
  } else {
    throw new OrderServerError("ORDER_CREATION_FAILED");
  }

  if (parsed > postgresBigintMaximum) {
    throw new OrderServerError("ORDER_CREATION_FAILED");
  }
  return parsed;
};

const readOptionalDatabaseCentavos = (
  value: unknown,
): string | null => {
  if (value === null) return null;
  return readDatabaseBigint(value).toString();
};

const isOrderStatus = (value: string): value is OrderStatus =>
  orderStatuses.some((status) => status === value);

const isPaymentStatus = (value: string): value is PaymentStatus =>
  paymentStatuses.some((status) => status === value);

const isFulfillmentMethod = (
  value: string,
): value is FulfillmentMethod =>
  fulfillmentMethods.some((method) => method === value);

const getNextAction = (
  orderStatus: OrderStatus,
  paymentStatus: PaymentStatus | "not_created",
  finalTotalCentavos: string | null,
): CreateOrderNextAction => {
  if (orderStatus === "pending_review" || finalTotalCentavos === null) {
    return "awaiting_review";
  }
  if (paymentStatus === "paid") return "order_confirmed";
  if (paymentStatus === "not_created") {
    return "awaiting_payment_instructions";
  }
  if (paymentStatus === "pending" || paymentStatus === "processing") {
    return "payment_initialization_pending";
  }
  return "awaiting_payment_instructions";
};

const getRequestFingerprint = (request: CreateOrderRequest): string =>
  sha256(JSON.stringify(request));

const getConfirmationToken = (idempotencyKey: string): string =>
  sha256(`gadgetmoto:order-confirmation:v1:${idempotencyKey}`);

async function loadExistingOrderResponse(
  sql: OrderTransaction,
  orderId: string,
  confirmationToken: string,
): Promise<CreateOrderSuccessResponse> {
  const rows = await sql<ExistingOrderRow[]>`
    select
      orders.public_order_number,
      orders.status,
      orders.delivery_method,
      orders.merchandise_subtotal_centavos,
      orders.delivery_fee_centavos,
      orders.vat_amount_centavos,
      orders.final_total_centavos,
      latest_payment.status as payment_status
    from public.orders as orders
    inner join public.order_fulfillments as fulfillments
      on fulfillments.order_id = orders.id
    left join lateral (
      select payments.status
      from public.payments as payments
      where payments.order_id = orders.id
      order by payments.created_at desc, payments.id desc
      limit 1
    ) as latest_payment on true
    where orders.id = ${orderId}
    limit 1
  `;

  const row = rows[0];
  if (
    !row ||
    typeof row.public_order_number !== "string" ||
    !isOrderStatus(row.status) ||
    !isFulfillmentMethod(row.delivery_method) ||
    (row.payment_status !== null &&
      !isPaymentStatus(row.payment_status))
  ) {
    throw new OrderServerError("ORDER_CREATION_FAILED");
  }

  const confirmedFinalTotalCentavos =
    readOptionalDatabaseCentavos(row.final_total_centavos);
  const paymentStatus = row.payment_status ?? "not_created";

  return {
    success: true,
    wasReplay: true,
    publicOrderNumber: row.public_order_number,
    orderStatus: row.status,
    paymentStatus,
    fulfillmentMethod: row.delivery_method,
    confirmedSubtotalCentavos: readDatabaseBigint(
      row.merchandise_subtotal_centavos,
    ).toString(),
    confirmedDeliveryFeeCentavos: readOptionalDatabaseCentavos(
      row.delivery_fee_centavos,
    ),
    confirmedVatCentavos: readOptionalDatabaseCentavos(
      row.vat_amount_centavos,
    ),
    confirmedFinalTotalCentavos,
    nextAction: getNextAction(
      row.status,
      paymentStatus,
      confirmedFinalTotalCentavos,
    ),
    confirmationToken,
  };
}

async function loadAuthoritativeProducts(
  sql: OrderTransaction,
  request: CreateOrderRequest,
): Promise<readonly PreparedOrderItem[]> {
  const productRows = await sql<AuthoritativeProductRow[]>`
    with requested(product_slug, sku, color_id, requested_order) as (
      select
        input.product_slug,
        input.sku,
        nullif(
          input.color_id,
          '00000000-0000-0000-0000-000000000000'::uuid
        ),
        input.requested_order
      from unnest(
        ${sql.array(request.items.map((item) => item.productSlug))}::text[],
        ${sql.array(request.items.map((item) => item.sku))}::text[],
        ${sql.array(request.items.map((item) => item.colorId ?? "00000000-0000-0000-0000-000000000000"))}::uuid[],
        ${sql.array(request.items.map((_, index) => index))}::integer[]
      ) as input(product_slug, sku, color_id, requested_order)
    )
    select
      requested.requested_order,
      products.id as product_id,
      products.slug as product_slug,
      products.name as product_name,
      brands.name as brand_name,
      variants.id as variant_id,
      variants.sku,
      variants.variant_name,
      variants.current_price_centavos,
      brands.is_active as brand_active,
      (products.status = 'active'::public.product_status) as product_active,
      coalesce(
        products.published_at is not null
          and products.published_at <= current_timestamp,
        false
      ) as product_published,
      variants.is_active as variant_active,
      colors.id as selected_color_id,
      colors.name as selected_color_name,
      exists (
        select 1
        from public.product_color_variants as available_colors
        where available_colors.product_id = products.id
          and available_colors.is_active is true
      ) as has_active_colors
    from requested
    inner join public.products as products
      on products.slug = requested.product_slug
    inner join public.brands as brands
      on brands.id = products.brand_id
    inner join public.product_variants as variants
      on variants.product_id = products.id
      and lower(variants.sku) = lower(requested.sku)
    left join public.product_color_variants as colors
      on colors.id = requested.color_id
      and colors.product_id = products.id
      and colors.is_active is true
    order by requested.requested_order asc
  `;

  if (productRows.length !== request.items.length) {
    throw new OrderServerError("PRODUCT_NOT_AVAILABLE");
  }

  return productRows.map((row, index) => {
    const requested = request.items[index];
    if (
      !requested ||
      row.requested_order !== index ||
      row.product_slug !== requested.productSlug ||
      row.sku.toLowerCase() !== requested.sku.toLowerCase() ||
      !row.brand_active ||
      !row.product_active ||
      !row.product_published ||
      !row.variant_active
    ) {
      throw new OrderServerError("PRODUCT_NOT_AVAILABLE");
    }
    if (
      (row.has_active_colors &&
        (!requested.colorId ||
          row.selected_color_id !== requested.colorId ||
          !row.selected_color_name)) ||
      (!row.has_active_colors && requested.colorId !== undefined)
    ) {
      throw new OrderServerError("INVALID_COLOR_SELECTION");
    }

    const unitPriceCentavos = readDatabaseBigint(
      row.current_price_centavos,
    );
    const lineTotalCentavos =
      unitPriceCentavos * BigInt(requested.quantity);
    if (lineTotalCentavos > postgresBigintMaximum) {
      throw new OrderServerError("ORDER_CREATION_FAILED");
    }

    return {
      productId: row.product_id,
      productSlug: row.product_slug,
      productName: row.product_name,
      brandName: row.brand_name,
      variantId: row.variant_id,
      sku: row.sku,
      variantName: row.variant_name,
      colorId: row.selected_color_id,
      colorName: row.selected_color_name,
      quantity: requested.quantity,
      unitPriceCentavos,
      lineTotalCentavos,
    };
  });
}

async function resolveFulfillmentLocation(
  sql: OrderTransaction,
  request: CreateOrderRequest,
  items: readonly PreparedOrderItem[],
): Promise<LocationRow | null> {
  if (request.fulfillment.method === "store_pickup") {
    const rows = await sql<LocationRow[]>`
      select
        locations.id as location_id,
        locations.slug as location_slug
      from public.store_locations as locations
      where locations.slug = ${request.fulfillment.pickupLocationSlug}
        and locations.is_active is true
      limit 1
    `;
    if (!rows[0]) {
      throw new OrderServerError("INVALID_PICKUP_LOCATION");
    }
    return rows[0];
  }

  const rows = await sql<LocationRow[]>`
    with requested(variant_id, quantity) as (
      select input.variant_id, sum(input.quantity)::integer
      from unnest(
        ${sql.array(items.map((item) => item.variantId))}::uuid[],
        ${sql.array(items.map((item) => item.quantity))}::integer[]
      ) as input(variant_id, quantity)
      group by input.variant_id
    )
    select
      levels.location_id,
      locations.slug as location_slug
    from requested
    inner join public.inventory_levels as levels
      on levels.variant_id = requested.variant_id
    inner join public.store_locations as locations
      on locations.id = levels.location_id
    where locations.is_active is true
      and (
        levels.quantity_on_hand - levels.quantity_reserved
      ) >= requested.quantity
    group by levels.location_id, locations.slug
    having count(*) = ${new Set(items.map((item) => item.variantId)).size}
    order by locations.slug asc, levels.location_id asc
    limit 1
  `;

  if (rows[0]) return rows[0];

  const coverageRows = await sql<InventoryCoverageRow[]>`
    select count(*)::integer as level_count
    from public.inventory_levels as levels
    inner join public.store_locations as locations
      on locations.id = levels.location_id
    where locations.is_active is true
      and levels.variant_id = any(
        ${sql.array(items.map((item) => item.variantId))}::uuid[]
      )
  `;

  if (coverageRows[0]?.level_count === 0) return null;
  throw new OrderServerError("INSUFFICIENT_INVENTORY");
}

async function lockAndValidateInventory(
  sql: OrderTransaction,
  location: LocationRow,
  items: readonly PreparedOrderItem[],
): Promise<void> {
  const rows = await sql<InventoryLevelRow[]>`
    select
      levels.variant_id,
      levels.location_id,
      levels.quantity_on_hand,
      levels.quantity_reserved
    from public.inventory_levels as levels
    where levels.location_id = ${location.location_id}
      and levels.variant_id = any(
        ${sql.array(items.map((item) => item.variantId))}::uuid[]
      )
    order by levels.variant_id asc
    for update
  `;

  const quantitiesByVariant = new Map<string, number>();
  for (const item of items) {
    quantitiesByVariant.set(
      item.variantId,
      (quantitiesByVariant.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  if (rows.length !== quantitiesByVariant.size) {
    throw new OrderServerError("INSUFFICIENT_INVENTORY");
  }

  const inventoryByVariant = new Map(
    rows.map((row) => [row.variant_id, row]),
  );
  for (const [variantId, quantity] of quantitiesByVariant) {
    const level = inventoryByVariant.get(variantId);
    if (
      !level ||
      level.location_id !== location.location_id ||
      !Number.isSafeInteger(level.quantity_on_hand) ||
      !Number.isSafeInteger(level.quantity_reserved) ||
      level.quantity_on_hand < 0 ||
      level.quantity_reserved < 0 ||
      level.quantity_on_hand - level.quantity_reserved < quantity
    ) {
      throw new OrderServerError("INSUFFICIENT_INVENTORY");
    }
  }
}

async function createNewOrder(
  sql: OrderTransaction,
  request: CreateOrderRequest,
  claimId: string,
  idempotencyKeyHash: string,
  confirmationToken: string,
): Promise<CreateOrderSuccessResponse> {
  const items = await loadAuthoritativeProducts(sql, request);
  const location = await resolveFulfillmentLocation(sql, request, items);
  if (location) {
    await lockAndValidateInventory(sql, location, items);
  }

  const subtotalCentavos = items.reduce(
    (subtotal, item) => subtotal + item.lineTotalCentavos,
    BigInt(0),
  );
  if (subtotalCentavos > postgresBigintMaximum) {
    throw new OrderServerError("ORDER_CREATION_FAILED");
  }

  // Delivery fee and VAT rules remain unresolved, so the final total remains
  // absent. Manual methods begin in instructions_pending and can never be
  // treated as paid by this customer-facing order service.
  const publicLookupTokenHash = sha256(confirmationToken);
  const orderRows = await sql<InsertedOrderRow[]>`
    insert into public.orders (
      public_order_number,
      public_lookup_token_hash,
      status,
      customer_full_name,
      customer_mobile,
      customer_email,
      delivery_method,
      payment_method,
      merchandise_subtotal_centavos,
      vat_rate_bps,
      vat_amount_centavos,
      delivery_fee_centavos,
      final_total_centavos,
      customer_notes,
      consent_privacy_at,
      consent_terms_at,
      consent_final_review_at
    )
    values (
      (
        'GM-' || upper(substr(${idempotencyKeyHash}, 1, 32))
      ),
      ${publicLookupTokenHash},
      'pending_review'::public.order_status,
      ${request.customer.fullName},
      ${request.customer.mobile},
      ${request.customer.email ?? null},
      ${request.fulfillment.method}::public.delivery_method,
      ${request.paymentMethod}::public.payment_method,
      ${subtotalCentavos.toString()},
      null,
      null,
      null,
      null,
      ${request.customerNotes ?? null},
      current_timestamp,
      current_timestamp,
      current_timestamp
    )
    returning id, public_order_number
  `;
  const orderId = orderRows[0]?.id;
  const publicOrderNumber = orderRows[0]?.public_order_number;
  if (!orderId || !publicOrderNumber) {
    throw new OrderServerError("ORDER_CREATION_FAILED");
  }

  const manualPaymentPending = request.paymentMethod !== "maya_online";
  if (manualPaymentPending) {
    const paymentRows = await sql<IdentifierRow[]>`
      insert into public.payments (
        order_id,
        method,
        status,
        amount_centavos
      )
      values (
        ${orderId},
        ${request.paymentMethod}::public.payment_method,
        'instructions_pending'::public.payment_status,
        null
      )
      returning id
    `;
    if (!paymentRows[0]) {
      throw new OrderServerError("ORDER_CREATION_FAILED");
    }
  }

  if (request.fulfillment.method !== "store_pickup") {
    const address = request.fulfillment.address;
    await sql`
      insert into public.order_addresses (
        order_id,
        street_address,
        province,
        city_municipality,
        barangay,
        postal_code
      )
      values (
        ${orderId},
        ${address.streetAddress},
        ${address.province},
        ${address.cityMunicipality},
        ${address.barangay},
        ${address.postalCode}
      )
    `;
  }

  const orderItemIds = new Map<PreparedOrderItem, string>();
  for (const item of items) {
    const itemRows = await sql<IdentifierRow[]>`
      insert into public.order_items (
        order_id,
        product_id,
        variant_id,
        color_variant_id,
        product_name_snapshot,
        brand_name_snapshot,
        variant_snapshot,
        color_name_snapshot,
        sku_snapshot,
        unit_price_centavos,
        quantity,
        line_total_centavos
      )
      values (
        ${orderId},
        ${item.productId},
        ${item.variantId},
        ${item.colorId},
        ${item.productName},
        ${item.brandName},
        ${item.variantName},
        ${item.colorName},
        ${item.sku},
        ${item.unitPriceCentavos.toString()},
        ${item.quantity},
        ${item.lineTotalCentavos.toString()}
      )
      returning id
    `;
    const orderItemId = itemRows[0]?.id;
    if (!orderItemId) {
      throw new OrderServerError("ORDER_CREATION_FAILED");
    }
    orderItemIds.set(item, orderItemId);
  }

  await sql`
    insert into public.order_fulfillments (
      order_id,
      status,
      location_id
    )
    values (
      ${orderId},
      'pending_confirmation'::public.fulfillment_status,
      ${location?.location_id ?? null}
    )
  `;

  if (location) {
    for (const item of [...items].sort((left, right) =>
      left.variantId.localeCompare(right.variantId),
    )) {
    const orderItemId = orderItemIds.get(item);
    if (!orderItemId) {
      throw new OrderServerError("ORDER_CREATION_FAILED");
    }

    const updatedLevels = await sql<IdentifierRow[]>`
      update public.inventory_levels
      set quantity_reserved = quantity_reserved + ${item.quantity}
      where variant_id = ${item.variantId}
        and location_id = ${location.location_id}
        and (
          quantity_on_hand - quantity_reserved
        ) >= ${item.quantity}
      returning id
    `;
    if (!updatedLevels[0]) {
      throw new OrderServerError("INSUFFICIENT_INVENTORY");
    }

    const reservationRows = await sql<IdentifierRow[]>`
      insert into public.inventory_reservations (
        order_id,
        order_item_id,
        variant_id,
        location_id,
        quantity,
        status,
        expires_at
      )
      values (
        ${orderId},
        ${orderItemId},
        ${item.variantId},
        ${location.location_id},
        ${item.quantity},
        'active'::public.inventory_reservation_status,
        current_timestamp + interval '30 minutes'
      )
      returning id
    `;
    const reservationId = reservationRows[0]?.id;
    if (!reservationId) {
      throw new OrderServerError("ORDER_CREATION_FAILED");
    }

    await sql`
      insert into public.inventory_movements (
        variant_id,
        location_id,
        movement_type,
        quantity_delta,
        reference_type,
        reference_id,
        reservation_id
      )
      values (
        ${item.variantId},
        ${location.location_id},
        'reservation'::public.inventory_movement_type,
        ${item.quantity},
        'order',
        ${orderId},
        ${reservationId}
      )
    `;
    }
  }

  await sql`
    insert into public.audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id
    )
    values (
      null,
      'order.created',
      'order',
      ${orderId}
    )
  `;

  const completedClaims = await sql<IdentifierRow[]>`
    update public.order_submissions
    set
      order_id = ${orderId},
      completed_at = current_timestamp
    where id = ${claimId}
      and order_id is null
    returning id
  `;
  if (!completedClaims[0]) {
    throw new OrderServerError("ORDER_CREATION_FAILED");
  }

  return {
    success: true,
    wasReplay: false,
    publicOrderNumber,
    orderStatus: "pending_review",
    paymentStatus: manualPaymentPending
      ? "instructions_pending"
      : "not_created",
    fulfillmentMethod: request.fulfillment.method,
    confirmedSubtotalCentavos: subtotalCentavos.toString(),
    confirmedDeliveryFeeCentavos: null,
    confirmedVatCentavos: null,
    confirmedFinalTotalCentavos: null,
    nextAction: "awaiting_review",
    confirmationToken,
  };
}

export async function createOrder(
  input: unknown,
): Promise<CreateOrderSuccessResponse> {
  try {
    const request = validateCreateOrderRequest(input);
    const idempotencyKeyHash = sha256(request.idempotencyKey);
    const requestFingerprint = getRequestFingerprint(request);
    const confirmationToken = getConfirmationToken(
      request.idempotencyKey,
    );
    const database = getOrderDatabaseClient();
    return await database.begin("read write", async (sql) => {
      const insertedClaims = await sql<SubmissionClaimRow[]>`
        insert into public.order_submissions (
          idempotency_key_hash,
          request_fingerprint
        )
        values (
          ${idempotencyKeyHash},
          ${requestFingerprint}
        )
        on conflict (idempotency_key_hash) do nothing
        returning id, request_fingerprint, order_id
      `;

      const insertedClaim = insertedClaims[0];
      if (insertedClaim) {
        return createNewOrder(
          sql,
          request,
          insertedClaim.id,
          idempotencyKeyHash,
          confirmationToken,
        );
      }

      const existingClaims = await sql<SubmissionClaimRow[]>`
        select
          submissions.id,
          submissions.request_fingerprint,
          submissions.order_id
        from public.order_submissions as submissions
        where submissions.idempotency_key_hash = ${idempotencyKeyHash}
        for update
      `;
      const existingClaim = existingClaims[0];
      if (
        !existingClaim ||
        existingClaim.request_fingerprint !== requestFingerprint
      ) {
        throw new OrderServerError("DUPLICATE_SUBMISSION");
      }
      if (!existingClaim.order_id) {
        throw new OrderServerError("ORDER_CREATION_FAILED");
      }

      return loadExistingOrderResponse(
        sql,
        existingClaim.order_id,
        confirmationToken,
      );
    });
  } catch (error) {
    throw sanitizeOrderServerError(error);
  }
}
