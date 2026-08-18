export type PreviewConfiguration = Readonly<{
  ramGb: number | null;
  storageGb: number;
  label: string;
}>;

export type UpcomingVariantResearch = Readonly<{
  sourceUrl: string;
  sourceRegion: "Philippines" | "Southeast Asia" | "Global";
  configurations: readonly PreviewConfiguration[];
  colors: readonly string[];
  note: string;
}>;

const configurations = (
  values: readonly [number | null, number][],
): readonly PreviewConfiguration[] =>
  values.map(([ramGb, storageGb]) => ({
    ramGb,
    storageGb,
    label: `${ramGb === null ? "RAM not published" : `${ramGb}GB RAM`} · ${storageGb}GB storage`,
  }));

/**
 * Only exact manufacturer-published information belongs here. Missing future
 * products intentionally remain absent and are reported for manual review.
 */
export const upcomingProductVariantResearch: Readonly<
  Record<string, UpcomingVariantResearch>
> = {
  "honor-600": {
    sourceUrl: "https://www.honor.com/ph/phones/honor-600/",
    sourceRegion: "Philippines",
    configurations: [],
    colors: ["Orange", "Golden White", "Black"],
    note: "The audited Philippine page confirms the colors but did not expose a complete local memory matrix.",
  },
  "apple-ipad-a16-11th-gen": {
    sourceUrl: "https://www.apple.com/ph/ipad-11/specs/",
    sourceRegion: "Philippines",
    configurations: configurations([[null, 128], [null, 256], [null, 512]]),
    colors: ["Silver", "Blue", "Pink", "Yellow"],
    note: "Apple does not publish customer-facing RAM capacity for this model.",
  },
  "apple-iphone-14": {
    sourceUrl: "https://support.apple.com/en-ph/111850",
    sourceRegion: "Philippines",
    configurations: configurations([[null, 128], [null, 256], [null, 512]]),
    colors: ["Midnight", "Purple", "Starlight", "(PRODUCT)RED", "Blue", "Yellow"],
    note: "Apple does not publish customer-facing RAM capacity for this model.",
  },
  "apple-iphone-15": {
    sourceUrl: "https://support.apple.com/en-my/111831",
    sourceRegion: "Southeast Asia",
    configurations: configurations([[null, 128], [null, 256], [null, 512]]),
    colors: ["Black", "Blue", "Green", "Yellow", "Pink"],
    note: "Malaysia is the closest audited official regional source; Philippine configuration availability still requires confirmation.",
  },
  "apple-iphone-16": {
    sourceUrl: "https://www.apple.com/ph/iphone-16/specs/",
    sourceRegion: "Philippines",
    configurations: configurations([[null, 128]]),
    colors: ["Black", "White", "Pink", "Teal", "Ultramarine"],
    note: "Only the storage value exposed in the audited Philippine page is listed; Apple does not publish customer-facing RAM.",
  },
  "poco-f6": {
    sourceUrl: "https://www.po.co/global/product/poco-f6/specs/",
    sourceRegion: "Global",
    configurations: configurations([[8, 256], [12, 512]]),
    colors: ["Black", "Green", "Titanium"],
    note: "Global manufacturer configurations; Philippine sale availability is unconfirmed.",
  },
  "poco-f7": {
    sourceUrl: "https://www.po.co/global/product/poco-f7/",
    sourceRegion: "Global",
    configurations: [],
    colors: ["Silver", "Black", "White"],
    note: "The audited official overview confirms colors, but its complete memory matrix was not exposed.",
  },
  "poco-x7-pro": {
    sourceUrl: "https://www.po.co/global/product/poco-x7-pro/specs/",
    sourceRegion: "Global",
    configurations: configurations([[8, 256], [12, 256], [12, 512]]),
    colors: ["Black", "Green", "Yellow"],
    note: "Global manufacturer configurations; Philippine sale availability is unconfirmed.",
  },
  "redmi-15-5g": {
    sourceUrl: "https://www.mi.com/global/product/redmi-15-5g/specs/",
    sourceRegion: "Global",
    configurations: configurations([[4, 128], [8, 256]]),
    colors: ["Ripple Green", "Titan Gray", "Midnight Black"],
    note: "Memory extension is not counted as physical RAM. Philippine sale availability is unconfirmed.",
  },
  "samsung-galaxy-a07-lte": {
    sourceUrl: "https://www.samsung.com/ph/smartphones/galaxy-a/galaxy-a07-black-128gb-sm-a075fzkgphl/",
    sourceRegion: "Philippines",
    configurations: configurations([[null, 128], [null, 256]]),
    colors: ["Black"],
    note: "The audited Philippine product pages confirm these storage listings; the complete local RAM and color matrix requires confirmation.",
  },
};
