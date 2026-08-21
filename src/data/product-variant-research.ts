export type ResearchedProductConfiguration = Readonly<{
  id: string;
  label: string;
  ramGb?: number;
  extendedRamGb?: number;
  storageGb: number;
  sourceUrl: string;
}>;

export type ResearchedProductColor = Readonly<{
  id: string;
  name: string;
  hexCode: null;
}>;

export type ResearchedProductCombination = Readonly<{
  colorName: string;
  ramGb?: number;
  extendedRamGb?: number;
  storageGb: number;
}>;

type ActiveProductResearch = Readonly<{
  sourceUrl: string;
  region: "Philippines" | "Southeast Asia" | "Global" | "Official regional";
  configurations: readonly ResearchedProductConfiguration[];
  colors: readonly ResearchedProductColor[];
  exactCombinations?: readonly ResearchedProductCombination[];
  notes?: string;
}>;

const option = (
  slug: string,
  ramGb: number | undefined,
  storageGb: number,
  sourceUrl: string,
  extendedRamGb?: number,
): ResearchedProductConfiguration => ({
  id: `manufacturer:${slug}:${ramGb ?? "storage-only"}:${storageGb}`,
  label: ramGb ? `${ramGb}GB + ${storageGb === 1024 ? "1TB" : `${storageGb}GB`}` : storageGb === 1024 ? "1TB" : `${storageGb}GB`,
  ...(ramGb ? { ramGb } : {}),
  ...(extendedRamGb ? { extendedRamGb } : {}),
  storageGb,
  sourceUrl,
});

const colors = (
  slug: string,
  names: readonly string[],
): readonly ResearchedProductColor[] =>
  names.map((name) => ({
    id: `official:${slug}:${name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    hexCode: null,
  }));

const xiaomi17Ultra = "https://www.mi.com/global/product/xiaomi-17-ultra/specs/";
const iphone17 = "https://www.apple.com/ph/iphone-17/specs/";
const pocoF8Ultra = "https://www.po.co/global/product/poco-f8-ultra/specs/";
const redmiNote15ProPlus = "https://www.mi.com/global/product/redmi-note-15-pro-plus-5g/specs/";
const redmiTurbo5 = "https://www.mi.com/in/product/redmi-turbo-5/specs/";
const infinixNote60Pro = "https://mx.pre.infinixmobility.com/note-60-pro";
const tecnoCamon50 = "https://www.tecno-mobile.com/id/phones/tech-specs/techspecs/camon-50/";
const pocoC85 = "https://www.po.co/global/product/poco-c85/specs/";
const pocoPadX1 = "https://www.po.co/global/product/poco-pad-x1/specs/";
const xiaomiPad8 = "https://www.mi.com/global/product/xiaomi-pad-8/specs/";
const redmiPad2Pro = "https://www.mi.com/global/product/redmi-pad-2-pro-5g/specs/";
const tecnoMegaPadPro = "https://www.tecno-mobile.com/laptops/product-detail/product/megapad-pro/";

/**
 * Manufacturer-confirmed options only. This data never creates a sellable
 * GadgetMoTo SKU or price. Commercial data continues to come from the
 * canonical product variant record.
 */
export const activeProductResearchBySlug: Readonly<
  Record<string, ActiveProductResearch>
> = {
  "xiaomi-17-ultra-5g-leica-kit": {
    sourceUrl: xiaomi17Ultra,
    region: "Global",
    configurations: [
      option("xiaomi-17-ultra-5g-leica-kit", 16, 512, xiaomi17Ultra),
      option("xiaomi-17-ultra-5g-leica-kit", 16, 1024, xiaomi17Ultra),
    ],
    colors: colors("xiaomi-17-ultra-5g-leica-kit", ["Black", "White", "Starlit Green"]),
    notes: "The Leica Kit bundle contents and Philippine allocation still require GadgetMoTo confirmation.",
  },
  "apple-iphone-17": {
    sourceUrl: iphone17,
    region: "Philippines",
    configurations: [
      option("apple-iphone-17", undefined, 256, iphone17),
      option("apple-iphone-17", undefined, 512, iphone17),
    ],
    colors: colors("apple-iphone-17", ["Black", "White", "Mist Blue", "Sage", "Lavender"]),
    exactCombinations: [256, 512].flatMap((storageGb) =>
      ["Black", "White", "Mist Blue", "Sage", "Lavender"].map(
        (colorName) => ({ colorName, storageGb }),
      ),
    ),
    notes: "Apple does not publish customer-facing RAM for this product, so only storage is displayed.",
  },
  "poco-f8-ultra": {
    sourceUrl: pocoF8Ultra,
    region: "Global",
    configurations: [
      option("poco-f8-ultra", 12, 256, pocoF8Ultra),
      option("poco-f8-ultra", 16, 512, pocoF8Ultra),
    ],
    colors: colors("poco-f8-ultra", ["Denim Blue", "Black"]),
  },
  "redmi-note-15-pro-plus-5g": {
    sourceUrl: redmiNote15ProPlus,
    region: "Global",
    configurations: [
      option("redmi-note-15-pro-plus-5g", 8, 256, redmiNote15ProPlus),
      option("redmi-note-15-pro-plus-5g", 12, 256, redmiNote15ProPlus),
      option("redmi-note-15-pro-plus-5g", 12, 512, redmiNote15ProPlus),
    ],
    colors: colors("redmi-note-15-pro-plus-5g", ["Black", "Glacier Blue", "Mocha Brown"]),
  },
  "redmi-turbo-5": {
    sourceUrl: redmiTurbo5,
    region: "Official regional",
    configurations: [
      option("redmi-turbo-5", 8, 256, redmiTurbo5),
      option("redmi-turbo-5", 12, 256, redmiTurbo5),
    ],
    colors: [],
    notes: "The official India specification confirms memory/storage but did not expose a reliable finish list in the audited content.",
  },
  "infinix-note-60-pro-5g": {
    sourceUrl: infinixNote60Pro,
    region: "Official regional",
    configurations: [],
    colors: colors("infinix-note-60-pro-5g", ["Mist Titanium", "Deep Ocean Blue", "Solar Orange", "Mocha Brown", "Frost Silver", "Torino Black"]),
    notes: "The exact physical-memory/storage allocations were not exposed by the audited official page. Existing GadgetMoTo commercial data remains unchanged.",
  },
  "tecno-camon-50": {
    sourceUrl: tecnoCamon50,
    region: "Southeast Asia",
    configurations: [
      option("tecno-camon-50", 8, 128, tecnoCamon50, 8),
      option("tecno-camon-50", 8, 256, tecnoCamon50, 8),
      option("tecno-camon-50", 12, 256, tecnoCamon50, 12),
    ],
    colors: colors("tecno-camon-50", ["Moonshadow Black", "Malachite Green", "Nebula Titanium"]),
  },
  "poco-c85": {
    sourceUrl: pocoC85,
    region: "Global",
    configurations: [
      option("poco-c85", 6, 128, pocoC85),
      option("poco-c85", 8, 256, pocoC85),
    ],
    colors: colors("poco-c85", ["Black", "Purple", "Green"]),
    notes: "Memory extension is not represented as physical RAM.",
  },
  "poco-pad-x1": {
    sourceUrl: pocoPadX1,
    region: "Global",
    configurations: [option("poco-pad-x1", 8, 512, pocoPadX1)],
    colors: colors("poco-pad-x1", ["Blue", "Grey"]),
  },
  "xiaomi-pad-8": {
    sourceUrl: xiaomiPad8,
    region: "Global",
    configurations: [
      option("xiaomi-pad-8", 8, 128, xiaomiPad8),
      option("xiaomi-pad-8", 8, 256, xiaomiPad8),
      option("xiaomi-pad-8", 12, 512, xiaomiPad8),
    ],
    colors: colors("xiaomi-pad-8", ["Pine Green", "Blue", "Gray"]),
  },
  "redmi-pad-2-pro-5g": {
    sourceUrl: redmiPad2Pro,
    region: "Global",
    configurations: [
      option("redmi-pad-2-pro-5g", 6, 128, redmiPad2Pro),
      option("redmi-pad-2-pro-5g", 8, 256, redmiPad2Pro),
    ],
    colors: colors("redmi-pad-2-pro-5g", ["Silver", "Graphite Gray"]),
  },
  "tecno-mega-pad-pro": {
    sourceUrl: tecnoMegaPadPro,
    region: "Global",
    configurations: [],
    colors: colors("tecno-mega-pad-pro", ["Sky Grey", "Aurora Purple"]),
    notes: "The exact memory/storage allocation was not exposed by the audited official page. Existing GadgetMoTo commercial data remains unchanged.",
  },
};
