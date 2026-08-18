"use client";

import { useMemo, useState } from "react";
import { PriceDisplay } from "@/components/ui/price-display";
import type { PrototypeProduct } from "@/data/prototype-products";
import {
  primaryPickupLocation,
  type ProductFulfillmentMethod,
} from "@/lib/storefront/pickup-location";
import { useCart } from "./cart-provider";

export function AddToCartButton({ product }: { product: PrototypeProduct }) {
  const defaultVariant =
    product.variants.find((variant) => variant.isDefault && variant.isActive) ??
    product.variants.find((variant) => variant.isActive) ??
    product.variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(
    defaultVariant?.id ?? "",
  );
  const [selectedColorId, setSelectedColorId] = useState(
    product.colors?.find((color) => color.purchasable)?.id ?? "",
  );
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<ProductFulfillmentMethod>("delivery");
  const { addItem, getItemQuantity } = useCart();
  const selectedVariant = useMemo(
    () =>
      product.variants.find(
        (variant) => variant.id === selectedVariantId && variant.isActive,
      ) ?? defaultVariant,
    [defaultVariant, product.variants, selectedVariantId],
  );
  const selectedColor = product.colors?.find(
    (color) => color.id === selectedColorId,
  );
  const canPurchase = Boolean(
    selectedVariant?.purchasable &&
      selectedVariant.sku &&
      selectedVariant.currentPrice !== null,
  );
  const quantity = selectedVariant
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
      <fieldset className="product-variant-selector">
        <legend>Memory &amp; Storage</legend>
        <div className="product-configurator__options">
          {product.variants
            .filter((variant) => variant.isActive)
            .map((variant) => (
              <label key={variant.id}>
                <input
                  checked={selectedVariant.id === variant.id}
                  name={`variant-${product.slug}`}
                  onChange={() => setSelectedVariantId(variant.id)}
                  type="radio"
                  value={variant.id}
                />
                <span>
                  <strong>{variant.name}</strong>
                  <small>
                    {variant.purchasable
                      ? "GadgetMoTo configuration"
                      : "Official configuration · contact us"}
                  </small>
                </span>
              </label>
            ))}
        </div>
      </fieldset>

      {product.colors?.length ? (
        <fieldset className="product-color-selector">
          <legend>Color: {selectedColor?.name}</legend>
          <div className="product-color-selector__options">
            {product.colors.map((color) => (
              <label key={color.id} title={color.name}>
                <input
                  checked={selectedColorId === color.id}
                  disabled={!color.purchasable}
                  name={`color-${product.slug}`}
                  onChange={() => setSelectedColorId(color.id)}
                  type="radio"
                  value={color.id}
                />
                <span
                  aria-hidden="true"
                  className="product-color-swatch"
                  style={
                    color.hexCode
                      ? { backgroundColor: color.hexCode }
                      : undefined
                  }
                />
                <span>{color.name}{color.purchasable ? "" : " · ask us"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="product-configurator__facts">
        <div>
          <span>Condition</span>
          <strong>{selectedVariant.condition}</strong>
        </div>
        <div>
          <span>Availability</span>
          <strong>{selectedVariant.availabilityMessage}</strong>
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
            <strong>Contact us for price</strong>
            <p>This official configuration is not yet a GadgetMoTo sellable variant.</p>
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
        <a
          className="button-link button-link--secondary"
          href="https://www.facebook.com/profile.php?id=100063905416187"
          rel="noopener noreferrer"
          target="_blank"
        >
          Message Us about this configuration
        </a>
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
