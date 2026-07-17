"use client";
import { useCart } from "./cart-provider";
export function AddToCartButton({ name, slug, variant }: { name: string; slug: string; variant: string }) { const { addItem, getItemQuantity } = useCart(); const quantity = getItemQuantity(slug, variant); return <div className="add-cart-control"><button className="button-link button-link--primary" onClick={() => addItem(slug, variant)} type="button">Add to Cart</button>{quantity ? <p>{quantity} currently in your cart</p> : <p aria-hidden="true">Ready to add</p>}<span className="sr-only">Add {name}, {variant}, to cart</span></div>; }
