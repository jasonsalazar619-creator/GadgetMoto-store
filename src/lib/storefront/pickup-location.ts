export const primaryPickupLocation = {
  slug: "gadgetmoto-dasmarinas-sabang",
  name: "GadgetMoTo Store Pickup",
  address:
    "LOT 1 DON PLACEDO CAMPUS AVE BRGY SABANG, Dasmariñas, Philippines, 4114",
  city: "Dasmariñas",
  province: "Cavite",
  postalCode: "4114",
} as const;

export const productFulfillmentMethods = ["delivery", "store_pickup"] as const;
export type ProductFulfillmentMethod =
  (typeof productFulfillmentMethods)[number];
