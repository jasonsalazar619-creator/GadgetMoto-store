export type PreviewConfiguration = Readonly<{
  ramGb: number | null;
  extendedRamGb?: number;
  storageGb: number;
  label: string;
}>;

export type PreviewCombination = Readonly<{
  color: string;
  ramGb: number | null;
  extendedRamGb?: number;
  storageGb: number;
}>;

export type UpcomingVariantResearch = Readonly<{
  sourceUrl: string;
  sourceRegion:
    | "Philippines"
    | "Southeast Asia"
    | "Official regional"
    | "Global";
  configurations: readonly PreviewConfiguration[];
  colors: readonly string[];
  exactCombinations?: readonly PreviewCombination[];
  note: string;
}>;

const configurations = (
  values: readonly [number | null, number, number?][],
): readonly PreviewConfiguration[] =>
  values.map(([ramGb, storageGb, extendedRamGb]) => ({
    ramGb,
    ...(extendedRamGb === undefined ? {} : { extendedRamGb }),
    storageGb,
    label: `${ramGb === null ? "RAM not published" : `${ramGb}GB RAM`}${extendedRamGb === undefined ? "" : ` + ${extendedRamGb}GB extended RAM`} · ${storageGb}GB storage`,
  }));

const allCombinations = (
  colors: readonly string[],
  variants: readonly [number | null, number, number?][],
): readonly PreviewCombination[] =>
  colors.flatMap((color) =>
    variants.map(([ramGb, storageGb, extendedRamGb]) => ({
      color,
      ramGb,
      ...(extendedRamGb === undefined ? {} : { extendedRamGb }),
      storageGb,
    })),
  );

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
  "honor-win-rt": {
    sourceUrl: "https://www.honor.com/cn/phones/honor-win-rt/",
    sourceRegion: "Official regional",
    configurations: configurations([[12, 256], [16, 256], [12, 512], [16, 512], [16, 1024]]),
    colors: ["快开黑", "指定赢", "不怕蓝"],
    exactCombinations: allCombinations(
      ["快开黑", "指定赢", "不怕蓝"],
      [[12, 256], [16, 256], [12, 512], [16, 512], [16, 1024]],
    ),
    note: "China-official HONOR WIN RT configurations. GadgetMoTo commercial availability remains disabled until explicitly enabled by an administrator.",
  },
  "honor-win": {
    sourceUrl: "https://www.honor.com/cn/phones/honor-win/",
    sourceRegion: "Official regional",
    configurations: configurations([[12, 512], [16, 512], [16, 1024]]),
    colors: ["快开黑", "指定赢", "不怕蓝"],
    exactCombinations: allCombinations(
      ["快开黑", "指定赢", "不怕蓝"],
      [[12, 512], [16, 512], [16, 1024]],
    ),
    note: "China-official HONOR WIN configurations. GadgetMoTo commercial availability remains disabled until explicitly enabled by an administrator.",
  },
  "infinix-note-edge-5g": {
    sourceUrl: "https://infinixmobiles.in/products/note-edge",
    sourceRegion: "Official regional",
    configurations: configurations([[6, 128, 6], [8, 128, 8], [8, 256, 8]]),
    colors: ["Solar Orange", "Lunar Titanium", "Stellar Blue", "Silk Green"],
    exactCombinations: allCombinations(
      ["Solar Orange", "Lunar Titanium", "Stellar Blue", "Silk Green"],
      [[6, 128, 6], [8, 128, 8], [8, 256, 8]],
    ),
    note: "Official India options for model X6887. Physical RAM and Extended RAM are preserved as separate values.",
  },
  "infinix-note-60-ultra": {
    sourceUrl: "https://ph.infinixmobility.com/NOTE-60-Ultra",
    sourceRegion: "Philippines",
    configurations: [],
    colors: ["TORINO BLACK (Basalt Fibre)", "AMALFI BLUE", "MONZA RED", "ROMA SILVER"],
    note: "The official Philippine page confirms the identity and four finish names, but does not publish a complete selectable physical-RAM/storage matrix; none is inferred.",
  },
  "infinix-smart-20": {
    sourceUrl: "https://infinixmobiles.in/collections/smartphones/products/smart-20",
    sourceRegion: "Official regional",
    configurations: configurations([[4, 64], [4, 128]]),
    colors: ["Sunlike Orange", "Shadow Black", "Polaris Titanium", "Cloudline Blue"],
    exactCombinations: allCombinations(
      ["Sunlike Orange", "Shadow Black", "Polaris Titanium", "Cloudline Blue"],
      [[4, 64], [4, 128]],
    ),
    note: "Official India storefront matrix for model X6840; the official Philippine page separately confirms the SMART 20 identity.",
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
    configurations: configurations([[null, 128], [null, 256], [null, 512]]),
    colors: ["Black", "White", "Pink", "Teal", "Ultramarine"],
    note: "Apple Philippines lists 128GB, 256GB, and 512GB capacities and does not publish customer-facing RAM.",
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
    configurations: configurations([[8, 256]]),
    colors: ["Black"],
    note: "The audited Philippine product page confirms the Black 8GB/256GB listing; the complete local RAM, storage, and color matrix still requires confirmation.",
  },
  "lenovo-legion-tab-y700-gen5": {
    sourceUrl: "https://psref.lenovo.com/syspool/Sys/PDF/Lenovo_Tablets/Legion_Tab_8_8_5/Legion_Tab_8_8_5_Spec.html",
    sourceRegion: "Official regional",
    configurations: configurations([[12, 256], [12, 512], [16, 512], [24, 1024]]),
    colors: ["碳晶黑", "冰魄白", "莱茵绿"],
    exactCombinations: [
      { color: "碳晶黑", ramGb: 12, storageGb: 256 },
      { color: "碳晶黑", ramGb: 12, storageGb: 512 },
      { color: "碳晶黑", ramGb: 16, storageGb: 512 },
      { color: "碳晶黑", ramGb: 24, storageGb: 1024 },
      { color: "冰魄白", ramGb: 12, storageGb: 256 },
      { color: "冰魄白", ramGb: 16, storageGb: 512 },
      { color: "莱茵绿", ramGb: 12, storageGb: 256 },
    ],
    note: "The existing image/spec record matches Lenovo Legion Tab (8.8-inch, 5), sold in China as Y700 fifth generation. Exact combinations are limited to audited Lenovo listings, including the Rhine Green limited edition.",
  },
  "lenovo-legion-y70-2026": {
    sourceUrl: "https://item.lenovo.com.cn/product/1054686.html",
    sourceRegion: "Official regional",
    configurations: configurations([[12, 256], [12, 512], [16, 512], [16, 1024]]),
    colors: ["碳晶黑", "冰魄白"],
    exactCombinations: allCombinations(
      ["碳晶黑", "冰魄白"],
      [[12, 256], [12, 512], [16, 512], [16, 1024]],
    ),
    note: "The existing image/spec record matches the China-official Legion Y70 New Generation smartphone. The catalog name is preserved; no commercial SKU or price is inferred.",
  },
  "lenovo-legion-tab-y700": {
    sourceUrl: "https://item.lenovo.com.cn/product/1045343.html",
    sourceRegion: "Official regional",
    configurations: configurations([[12, 256], [16, 512], [16, 1024]]),
    colors: ["碳晶黑", "冰魄白"],
    exactCombinations: [
      { color: "碳晶黑", ramGb: 12, storageGb: 256 },
      { color: "冰魄白", ramGb: 12, storageGb: 256 },
      { color: "碳晶黑", ramGb: 16, storageGb: 512 },
      { color: "冰魄白", ramGb: 16, storageGb: 512 },
      { color: "冰魄白", ramGb: 16, storageGb: 1024 },
    ],
    note: "The supplied product image and current specifications match the China-official Y700 fourth generation. Only combinations verified on audited Lenovo listings are recorded.",
  },
};
