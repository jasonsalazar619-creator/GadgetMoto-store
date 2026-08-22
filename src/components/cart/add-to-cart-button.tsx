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

function manufacturerCombinationKey(
  colorName: string,
  variant: Pick<ProductVariant, "ramGb" | "extendedRamGb" | "storageGb">,
): string {
  return [
    colorName.trim().toLocaleLowerCase(),
    variant.ramGb ?? "storage-only",
    variant.extendedRamGb ?? "none",
    variant.storageGb,
  ].join(":");
}

function getConfigurationChoices(
  product: PrototypeProduct,
): readonly ConfigurationChoice[] {
  const variants = product.variants.filter((variant) => variant.isActive);
  const colors = product.colors ?? [];
  const commercialColors = colors.filter((color) => color.purchasable);
  if (!commercialColors.length) {
    return variants.filter((variant) => variant.purchasable).map((variant) => ({
      key: variant.id,
      variant,
      color: null,
      isAvailable: true,
    }));
  }

  const availablePairs = new Set(
    product.variantColorOptions
      .filter(({ isAvailable }) => isAvailable)
      .map(({ variantId, colorId }) => `${variantId}:${colorId}`),
  );
  const verifiedManufacturerPairs = new Set(
    product.manufacturerCombinations.map((combination) =>
      manufacturerCombinationKey(combination.colorName, combination),
    ),
  );
  return colors.flatMap((color) =>
    variants.flatMap((variant) => {
      const pairId = `${variant.id}:${color.id}`;
      const isAvailable =
        variant.purchasable && availablePairs.has(pairId);
      const isManufacturerVerified = verifiedManufacturerPairs.has(
        manufacturerCombinationKey(color.name, variant),
      );
      const isCommercialPair = color.purchasable && variant.purchasable;
      return isCommercialPair || isAvailable || isManufacturerVerified
        ? [
            {
              key: pairId,
              variant,
              color,
              isAvailable,
            },
          ]
        : [];
    }),
  );
}

export function AddToCartButton({ product }: { product: PrototypeProduct }) {
  const choices = useMemo(() => getConfigurationChoices(product), [product]);
  const colorChoices = useMemo(() => {
    const colors = new Map<string, ProductColor>();
    for (const choice of choices) {
      if (choice.color && !colors.has(choice.color.id)) {
        colors.set(choice.color.id, choice.color);
      }
    }
    return [...colors.values()];
  }, [choices]);
  const variantChoices = useMemo(() => {
    const variants = new Map<string, ProductVariant>();
    for (const choice of choices) {
      if (!variants.has(choice.variant.id)) {
        variants.set(choice.variant.id, choice.variant);
      }
    }
    return [...variants.values()];
  }, [choices]);
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
  const selectColor = (colorId: string) => {
    const nextChoice =
      choices.find(
        (choice) =>
          choice.isAvailable &&
          choice.color?.id === colorId &&
          choice.variant.id === selectedVariant?.id,
      ) ??
      choices.find(
        (choice) => choice.isAvailable && choice.color?.id === colorId,
      );
    if (nextChoice) setSelectedChoiceKey(nextChoice.key);
  };
  const selectVariant = (variantId: string) => {
    const nextChoice = choices.find(
      (choice) =>
        choice.isAvailable &&
        choice.variant.id === variantId &&
        (selectedColor
          ? choice.color?.id === selectedColor.id
          : choice.color === null),
    );
    if (nextChoice) setSelectedChoiceKey(nextChoice.key);
  };
  const canPurchase = Boolean(
    selectedChoice?.isAvailable &&
      selectedVariant?.purchasable &&
      selectedVariant.sku &&
      selectedVariant.currentPrice !== null &&
      selectedVariant.currentPrice > 0,
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
      {colorChoices.length ? (
        <fieldset className="product-color-selector">
          <legend>
            Color{selectedColor ? `: ${selectedColor.name}` : ""}
          </legend>
          <div className="product-configurator__options product-configurator__options--colors">
            {colorChoices.map((color) => {
              const isAvailable = choices.some(
                (choice) =>
                  choice.isAvailable && choice.color?.id === color.id,
              );
              return (
                <label key={color.id}>
                  <input
                    checked={selectedColor?.id === color.id}
                    disabled={!isAvailable}
                    name={`color-${product.slug}`}
                    onChange={() => selectColor(color.id)}
                    type="radio"
                    value={color.id}
                  />
                  <span>
                    <strong>
                      <i
                        aria-hidden="true"
                        className="product-color-swatch"
                        style={
                          color.hexCode
                            ? { backgroundColor: color.hexCode }
                            : undefined
                        }
                      />
                      {color.name}
                    </strong>
                    <small>{isAvailable ? "Available" : "Unavailable"}</small>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="product-memory-selector">
        <legend>
          Memory / Storage{selectedChoice ? `: ${selectedVariant.name}` : ""}
        </legend>
        <div className="product-configurator__options product-configurator__options--memory">
          {variantChoices.length ? variantChoices.map((variant) => {
            const matchingChoice = choices.find(
              (choice) =>
                choice.variant.id === variant.id &&
                (selectedColor
                  ? choice.color?.id === selectedColor.id
                  : choice.color === null),
            );
            const isAvailable = matchingChoice?.isAvailable === true;
            return (
              <label key={variant.id}>
              <input
                checked={selectedVariant.id === variant.id && isAvailable}
                disabled={!isAvailable}
                name={`memory-${product.slug}`}
                onChange={() => selectVariant(variant.id)}
                type="radio"
                value={variant.id}
              />
              <span>
                <strong>{variant.name}</strong>
                <small>{isAvailable ? "Available" : "Unavailable"}</small>
              </span>
            </label>
            );
          }) : (
            <p>No memory or storage configuration is currently configured.</p>
          )}
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
