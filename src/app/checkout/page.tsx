import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import {
  isOnlineOrderingEnabled,
  isPaymentGatewayEnabled,
} from "@/lib/orders/server/config";

export const metadata: Metadata = {
  title: "Checkout | GadgetMoTo",
  description:
    "Review your GadgetMoTo cart and prepare a delivery order inquiry.",
  alternates: { canonical: "/checkout" },
};

export default function CheckoutPage() {
  return (
    <StorefrontPageShell>
      <Container className="storefront-container py-[var(--space-section)]">
        <CheckoutForm
          onlineOrderingEnabled={isOnlineOrderingEnabled()}
          paymentGatewayEnabled={isPaymentGatewayEnabled()}
        />
      </Container>
    </StorefrontPageShell>
  );
}
