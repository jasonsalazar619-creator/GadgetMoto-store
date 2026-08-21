"use client";

import { useMemo, useState } from "react";
import { PriceDisplay } from "@/components/ui/price-display";
import type {
  ProductColor,
  ProductVariant,
  PrototypeProduct,
} from "@/data/prototype-products";
import {
  primaryPickupLocation,
  type ProductFulfillmentMethod,
} from "@/lib/storefront/pickup-location";
import { useCart } from "./cart-provider";

type ConfigurationChoice = Readonly<{
  key: string;
  variant: ProductVariant;
  color: ProductColor | null;
  isAvailable: boolean;
}>;

function getConfigurationChoices(
  product: PrototypeProduct,
): readonly ConfigurationChoice[] {
  const variants = product.variants.filter((variant) => variant.isActive);
  const colors = product.colors ?? [];
  if (!colors.length) {
    return variants.map((variant) => ({
      key: variant.id,
      variant,
      color: null,
      isAvailable: variant.purchasable,
    }));
  }

  const availablePairs = new Set(
    product.variantColorOptions
      .filter(({ isAvailable }) => isAvailable)
      .map(({ variantId, colorId }) => `${variantId}:${colorId}`),
  );
  return colors.flatMap((color) =>
    variants.map((variant) => ({
      key: `${variant.id}:${color.id}`,
      variant,
      color,
      isAvailable:
        variant.purchasable &&
        availablePairs.has(`${variant.id}:${color.id}`),
    })),
  );
}

export function AddToCartButton({ product }: { product: PrototypeProduct }) {
  const choices = useMemo(() => getConfigurationChoices(product), [product]);
  const defaultChoice = choices.find(({ isAvailable }) => isAvailable);
  const defaultVariant =
    product.variants.find((variant) => variant.isDefault && variant.isActive) ??
    product.variants.find((variant) => variant.isActive) ??
    product.variants[0];
  const [selectedChoiceKey, setSelectedChoiceKey] = useState(
    defaultChoice?.key ?? "",
  );
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<ProductFulfillmentMethod>("delivery");
  const { addItem, getItemQuantity } = useCart();
  const selectedChoice =
    choices.find(
      (choice) =>
        choice.key === selectedChoiceKey && choice.isAvailable,
    ) ?? defaultChoice;
  const selectedVariant = selectedChoice?.variant ?? defaultVariant;
  const selectedColor = selectedChoice?.color ?? null;
  const canPurchase = Boolean(
    selectedChoice?.isAvailable &&
      selectedVariant?.purchasable &&
      selectedVariant.sku &&
      selectedVariant.currentPrice !== null,
  );
  const quantity = selectedChoice && selectedVariant
    ? getItemQuantity(
        product.slug,
        selectedVariant.id,
        selectedColor?.id,
        fulfillmentMethod,
      )
    : 0;

  if (!selectedVariant) return null;

  return (
    <div className="product-configurator">
      <fieldset className="product-combination-selector">
        <legend>
          Variant
          {selectedChoice
            ? `: ${selectedColor ? `${selectedColor.name}, ` : ""}${selectedVariant.name}`
            : ""}
        </legend>
        <div className="product-configurator__options product-configurator__options--combinations">
          {choices.map((choice) => (
            <label key={choice.key}>
              <input
                checked={selectedChoice?.key === choice.key}
                disabled={!choice.isAvailable}
                name={`configuration-${product.slug}`}
                onChange={() => setSelectedChoiceKey(choice.key)}
                type="radio"
                value={choice.key}
              />
              <span>
                <strong>
                  {choice.color ? (
                    <i
                      aria-hidden="true"
                      className="product-color-swatch"
                      style={
                        choice.color.hexCode
                          ? { backgroundColor: choice.color.hexCode }
                          : undefined
                      }
                    />
                  ) : null}
                  {choice.color ? `${choice.color.name}, ` : ""}
                  {choice.variant.name}
                </strong>
                <small>{choice.isAvailable ? "Available" : "Unavailable"}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="product-configurator__facts">
        <div>
          <span>SKU</span>
          <strong>{selectedVariant.sku ?? "Unavailable"}</strong>
        </div>
        {selectedVariant.ramGb ? (
          <div>
            <span>Physical RAM</span>
            <strong>{selectedVariant.ramGb}GB</strong>
          </div>
        ) : null}
        <div>
          <span>Storage</span>
          <strong>
            {selectedVariant.storageGb === 1024
              ? "1TB"
              : `${selectedVariant.storageGb}GB`}
          </strong>
        </div>
        <div>
          <span>Condition</span>
          <strong>{selectedVariant.condition}</strong>
        </div>
        <div>
          <span>Availability</span>
          <strong>{canPurchase ? "Available" : "Currently unavailable"}</strong>
        </div>
        {selectedVariant.extendedRamGb ? (
          <div>
            <span>Extended RAM</span>
            <strong>Up to {selectedVariant.extendedRamGb}GB</strong>
          </div>
        ) : null}
      </div>

      <fieldset className="product-fulfillment-selector">
        <legend>How would you like to receive it?</legend>
        <div className="product-configurator__options product-configurator__options--fulfillment">
          <label>
            <input
              checked={fulfillmentMethod === "delivery"}
              name={`fulfillment-${product.slug}`}
              onChange={() => setFulfillmentMethod("delivery")}
              type="radio"
              value="delivery"
            />
            <span>
              <strong>Delivery</strong>
              <small>Delivery fee and timing pending confirmation</small>
            </span>
          </label>
          <label>
            <input
              checked={fulfillmentMethod === "store_pickup"}
              name={`fulfillment-${product.slug}`}
              onChange={() => setFulfillmentMethod("store_pickup")}
              type="radio"
              value="store_pickup"
            />
            <span>
              <strong>Store Pickup</strong>
              <small>Pickup availability subject to confirmation</small>
            </span>
          </label>
        </div>
        {fulfillmentMethod === "store_pickup" ? (
          <address className="product-pickup-address">
            <strong>{primaryPickupLocation.name}</strong>
            <span>LOT 1 DON PLACEDO CAMPUS AVE</span>
            <span>BRGY SABANG</span>
            <span>Dasmariñas, Philippines 4114</span>
          </address>
        ) : null}
      </fieldset>

      <div aria-live="polite" className="product-configurator__commercial">
        {selectedVariant.currentPrice === null ? (
          <div>
            <strong>Price unavailable</strong>
            <p>This configuration is not currently available on the storefront.</p>
          </div>
        ) : (
          <>
            <PriceDisplay
              currentPrice={selectedVariant.currentPrice}
              originalPrice={selectedVariant.srp}
            />
            {selectedVariant.financingAvailable ? (
              <p className="font-semibold text-[var(--color-action)]">
                Financing options available
              </p>
            ) : null}
          </>
        )}
      </div>

      {canPurchase ? (
        <button
          className="button-link button-link--primary"
          onClick={() =>
            addItem(
              product.slug,
              selectedVariant.id,
              selectedColor?.id,
              fulfillmentMethod,
            )
          }
          type="button"
        >
          Add to Cart
        </button>
      ) : (
        <button
          className="button-link button-link--secondary"
          disabled
          type="button"
        >
          Currently unavailable
        </button>
      )}
      {quantity ? (
        <p>{quantity} currently in your cart with this configuration</p>
      ) : (
        <p aria-hidden="true">{canPurchase ? "Ready to add" : "Not available to add"}</p>
      )}
      <span className="sr-only">
        Add {product.name}, {selectedVariant.name}
        {selectedColor ? `, color ${selectedColor.name}` : ""}, for {fulfillmentMethod === "store_pickup" ? "store pickup" : "delivery"}.
      </span>
    </div>
  );
}
