"use client";

import { useState } from "react";
import type { ProductColor } from "@/data/prototype-products";
import { useCart } from "./cart-provider";

export function AddToCartButton({
  colors,
  name,
  slug,
  variant,
}: {
  colors: readonly ProductColor[];
  name: string;
  slug: string;
  variant: string;
}) {
  const [selectedColorId, setSelectedColorId] = useState(
    colors[0]?.id ?? "",
  );
  const { addItem, getItemQuantity } = useCart();
  const selectedColor = colors.find(
    (color) => color.id === selectedColorId,
  );
  const quantity = getItemQuantity(
    slug,
    variant,
    selectedColor?.id,
  );

  return (
    <div className="add-cart-control">
      {colors.length ? (
        <fieldset className="product-color-selector">
          <legend>Color: {selectedColor?.name}</legend>
          <div className="product-color-selector__options">
            {colors.map((color) => (
              <label key={color.id} title={color.name}>
                <input
                  checked={selectedColorId === color.id}
                  name={`color-${slug}`}
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
                <span>{color.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <button
        className="button-link button-link--primary"
        onClick={() => addItem(slug, variant, selectedColor?.id)}
        type="button"
      >
        Add to Cart
      </button>
      {quantity ? (
        <p>{quantity} currently in your cart</p>
      ) : (
        <p aria-hidden="true">Ready to add</p>
      )}
      <span className="sr-only">
        Add {name}, {variant}
        {selectedColor ? `, color ${selectedColor.name}` : ""}, to cart
      </span>
    </div>
  );
}
