export type UpcomingProductSpecification = Readonly<{
  label: string;
  value: string;
}>;

export type UpcomingProductContent = Readonly<{
  shortDescription: string;
  description: string;
  highlights: readonly string[];
  specifications: readonly UpcomingProductSpecification[];
}>;

type ContentSeed = Readonly<{
  name: string;
  device: "phone" | "tablet" | "device";
  focus: string;
  audience: string;
  verifiedSummary?: string;
  highlights?: readonly string[];
  specifications?: readonly UpcomingProductSpecification[];
}>;

const specification = (
  label: string,
  value: string,
): UpcomingProductSpecification => ({ label, value });

const seeds: Readonly<Record<string, ContentSeed>> = {
  "honor-600": {
    name: "HONOR 600",
    device: "phone",
    focus: "a high-refresh display, a versatile camera system, and extensive ingress protection",
    audience: "people balancing photography, entertainment, and everyday mobile use",
    verifiedSummary:
      "HONOR lists a 2728 × 1264 display with refresh rates up to 120Hz, a 200MP main camera, and IP68, IP69, and IP69K ratings.",
    highlights: ["Up to 120Hz display", "200MP main camera", "50MP telephoto camera", "IP68, IP69, and IP69K ratings"],
    specifications: [
      specification("Display", "2728 × 1264, up to 120Hz"),
      specification("Rear cameras", "200MP main, 50MP telephoto, 12MP ultra-wide"),
      specification("Durability", "IP68, IP69, and IP69K"),
    ],
  },
  "honor-win-rt": {
    name: "HONOR WIN RT",
    device: "phone",
    focus: "a streamlined handset concept whose exact regional configuration still needs confirmation",
    audience: "customers following HONOR announcements before choosing a future phone",
  },
  "honor-win": {
    name: "HONOR WIN",
    device: "phone",
    focus: "a future-facing HONOR handset identity awaiting an exact official product match",
    audience: "shoppers who want to track emerging HONOR models without relying on unverified specifications",
  },
  "honor-x9d": {
    name: "HONOR X9d",
    device: "phone",
    focus: "long battery endurance, a bright high-refresh display, and reinforced environmental protection",
    audience: "users who prioritize durability, battery capacity, and comfortable everyday viewing",
    verifiedSummary:
      "HONOR documents an 8300mAh battery, a 6.79-inch 1.5K AMOLED display at up to 120Hz, Snapdragon 6 Gen 4, and IP69K protection.",
    highlights: ["8300mAh battery", "6.79-inch 1.5K AMOLED display", "Up to 120Hz refresh rate", "IP69K protection"],
    specifications: [
      specification("Display", "6.79-inch 1.5K AMOLED, up to 120Hz"),
      specification("Processor", "Snapdragon 6 Gen 4"),
      specification("Rear camera", "108MP main camera"),
      specification("Battery", "8300mAh"),
      specification("Charging", "66W wired"),
      specification("Durability", "IP69K"),
    ],
  },
  "infinix-gt30-5g": {
    name: "Infinix GT30 5G",
    device: "phone",
    focus: "gaming-oriented styling and 5G connectivity while its market-specific hardware remains under review",
    audience: "mobile players tracking the next additions to Infinix’s GT line",
  },
  "infinix-gt30-pro": {
    name: "Infinix GT30 Pro",
    device: "phone",
    focus: "a performance-led GT-series experience positioned around mobile play and responsive interaction",
    audience: "enthusiasts comparing gaming-focused Infinix phones before regional details are finalized",
  },
  "infinix-hot-70": {
    name: "Infinix Hot 70",
    device: "phone",
    focus: "accessible everyday smartphone use within Infinix’s familiar Hot family",
    audience: "buyers monitoring practical new handsets for communication, media, and routine apps",
  },
  "infinix-note-edge-5g": {
    name: "Infinix Note Edge 5G",
    device: "phone",
    focus: "a Note-series form factor paired with 5G connectivity in the submitted product identity",
    audience: "users interested in larger-screen Infinix phones for connected daily tasks",
  },
  "infinix-note-60-ultra": {
    name: "Infinix Note 60 Ultra",
    device: "phone",
    focus: "an upper-tier Note-series concept awaiting confirmation of its exact manufacturer configuration",
    audience: "customers following Infinix’s premium-leaning Note releases and future regional availability",
  },
  "infinix-smart-20": {
    name: "Infinix Smart 20",
    device: "phone",
    focus: "straightforward smartphone essentials under an identity that still requires official verification",
    audience: "first-time and value-conscious users watching for practical Infinix options",
  },
  "identity-to-be-confirmed": {
    name: "Product identity to be confirmed",
    device: "device",
    focus: "a deliberately neutral preview while the source image and exact model identity are reconciled",
    audience: "visitors who need a transparent record of an unresolved catalog candidate",
  },
  "apple-ipad-a16-11th-gen": {
    name: "Apple iPad A16 11th Gen",
    device: "tablet",
    focus: "a spacious Liquid Retina display, A16 performance, and flexible connectivity for everyday tasks",
    audience: "students, families, and mobile workers seeking a versatile general-purpose tablet",
    verifiedSummary:
      "Apple specifies a 10.86-inch Liquid Retina display, the A16 chip, 12MP front and rear cameras, USB-C, Wi‑Fi 6, and optional 5G.",
    highlights: ["10.86-inch Liquid Retina display", "A16 chip", "12MP Center Stage front camera", "USB-C connectivity", "Optional 5G cellular model"],
    specifications: [
      specification("Display", "10.86-inch Liquid Retina, 2360 × 1640"),
      specification("Processor", "Apple A16"),
      specification("Cameras", "12MP rear; 12MP Center Stage front"),
      specification("Storage", "128GB, 256GB, or 512GB"),
      specification("Connectivity", "Wi‑Fi 6, Bluetooth 5.3, USB-C; optional 5G"),
    ],
  },
  "apple-iphone-14": {
    name: "Apple iPhone 14",
    device: "phone",
    focus: "a compact OLED display, familiar iOS experience, and dual-camera imaging",
    audience: "Apple users seeking a balanced handset for communication, photography, and media",
    verifiedSummary:
      "Apple documents a 6.1-inch Super Retina XDR OLED display, A15 Bionic, a dual 12MP camera system, 5G, and IP68 resistance.",
    highlights: ["6.1-inch Super Retina XDR display", "A15 Bionic chip", "Dual 12MP rear cameras", "5G connectivity", "IP68 resistance"],
    specifications: [
      specification("Display", "6.1-inch OLED, 2532 × 1170"),
      specification("Processor", "A15 Bionic"),
      specification("Rear cameras", "12MP main and 12MP ultra-wide"),
      specification("Connectivity", "5G and Wi‑Fi 6"),
      specification("Durability", "IP68"),
    ],
  },
  "apple-iphone-15": {
    name: "Apple iPhone 15",
    device: "phone",
    focus: "a bright OLED display, 48MP main camera, and convenient USB-C connection",
    audience: "users wanting a modern iPhone for imaging, messaging, and daily applications",
    verifiedSummary:
      "Apple lists a 6.1-inch Super Retina XDR OLED display, A16 Bionic, 48MP main and 12MP ultra-wide cameras, USB-C, 5G, and IP68 resistance.",
    highlights: ["6.1-inch Super Retina XDR display", "A16 Bionic chip", "48MP main camera", "USB-C connector", "IP68 resistance"],
    specifications: [
      specification("Display", "6.1-inch OLED, 2556 × 1179"),
      specification("Processor", "A16 Bionic"),
      specification("Rear cameras", "48MP main and 12MP ultra-wide"),
      specification("Connectivity", "USB-C and 5G"),
      specification("Durability", "IP68"),
    ],
  },
  "apple-iphone-16": {
    name: "Apple iPhone 16",
    device: "phone",
    focus: "A18 performance, a versatile Fusion camera system, and current-generation wireless connectivity",
    audience: "iPhone users seeking a compact flagship experience for creative and everyday work",
    verifiedSummary:
      "Apple specifies the A18 chip, a 48MP Fusion camera, 12MP ultra-wide camera, USB-C, Wi‑Fi 7, 5G, and IP68 resistance.",
    highlights: ["A18 chip", "48MP Fusion camera", "12MP ultra-wide camera", "Wi‑Fi 7 and 5G", "IP68 resistance"],
    specifications: [
      specification("Display", "6.1-inch Super Retina XDR OLED"),
      specification("Processor", "A18"),
      specification("Rear cameras", "48MP Fusion and 12MP ultra-wide"),
      specification("Connectivity", "USB-C, 5G, and Wi‑Fi 7"),
      specification("Durability", "IP68"),
    ],
  },
  "iqoo-15-ultra": {
    name: "iQOO 15 Ultra",
    device: "phone",
    focus: "a high-end performance identity listed by iQOO without enough regional detail for a complete specification set",
    audience: "enthusiasts monitoring iQOO’s flagship lineup and gaming-led releases",
  },
  "iqoo-15": {
    name: "iQOO 15",
    device: "phone",
    focus: "flagship processing, a high-resolution 144Hz display, and a large battery",
    audience: "performance-focused users balancing mobile gaming, photography, and intensive daily apps",
    verifiedSummary:
      "iQOO lists Snapdragon 8 Elite Gen 5, a 6.85-inch 144Hz AMOLED display, a 7000mAh battery with 100W charging, and IP68/IP69 protection.",
    highlights: ["Snapdragon 8 Elite Gen 5", "6.85-inch 144Hz AMOLED display", "7000mAh battery", "100W wired charging", "IP68 and IP69 ratings"],
    specifications: [
      specification("Display", "6.85-inch AMOLED, 3168 × 1440, up to 144Hz"),
      specification("Processor", "Snapdragon 8 Elite Gen 5"),
      specification("Rear cameras", "Triple 50MP system"),
      specification("Battery", "7000mAh"),
      specification("Charging", "100W wired"),
      specification("Operating system", "OriginOS 6 based on Android 16"),
    ],
  },
  "iqoo-z10-turbo-plus": {
    name: "iQOO Z10 Turbo Plus",
    device: "phone",
    focus: "a performance-oriented Z-series identity officially listed in China but not fully documented for this preview",
    audience: "mobile gamers following iQOO’s Turbo-branded devices and future market releases",
  },
  "iqoo-z10-turbo-pro": {
    name: "iQOO Z10 Turbo Pro",
    device: "phone",
    focus: "a Turbo-series smartphone concept centered on responsive performance pending exact regional verification",
    audience: "users comparing performance-led iQOO models before confirmed local configurations emerge",
  },
  "iqoo-z11-turbo": {
    name: "iQOO Z11 Turbo",
    device: "phone",
    focus: "a newer Z-series performance handset whose detailed specification record remains region-specific",
    audience: "enthusiasts tracking iQOO’s evolving Turbo line for gaming and demanding apps",
  },
  "iqoo-z11": {
    name: "iQOO Z11",
    device: "phone",
    focus: "a current Z-series identity awaiting a complete official specification page for this market",
    audience: "customers following iQOO phones for balanced performance and everyday connectivity",
  },
  "itel-power70": {
    name: "itel Power70",
    device: "phone",
    focus: "a large battery, practical display, and straightforward Android hardware for daily essentials",
    audience: "value-focused users prioritizing communication, battery capacity, and uncomplicated operation",
    verifiedSummary:
      "itel specifies a 6.67-inch HD+ display, Helio G50 Ultimate, 6000mAh battery, 18W USB-C charging, and IP54 protection.",
    highlights: ["6000mAh battery", "18W USB-C charging", "6.67-inch HD+ display", "IP54 protection"],
    specifications: [
      specification("Display", "6.67-inch HD+"),
      specification("Processor", "Helio G50 Ultimate"),
      specification("Cameras", "13MP rear; 8MP front"),
      specification("Battery", "6000mAh"),
      specification("Charging", "18W USB-C"),
      specification("Durability", "IP54"),
    ],
  },
  "itel-s26-ultra": {
    name: "itel S26 Ultra",
    device: "phone",
    focus: "a submitted S-series identity that does not yet match an exact official manufacturer listing",
    audience: "itel followers who prefer verified model details before evaluating a new handset",
  },
  "lenovo-legion-tab-y700-gen5": {
    name: "Lenovo Legion Tab Y700 Gen5",
    device: "tablet",
    focus: "a compact Legion gaming-tablet concept whose generation label still needs official confirmation",
    audience: "players seeking a portable tablet format for games and media",
  },
  "lenovo-legion-y70-2026": {
    name: "Lenovo Legion Y70 2026",
    device: "device",
    focus: "a Legion-branded identity represented by two supplied images but lacking a confirmed device category",
    audience: "visitors tracking Lenovo gaming hardware while its exact model record is resolved",
  },
  "lenovo-legion-tab-y700": {
    name: "Lenovo Legion Tab Y700",
    device: "tablet",
    focus: "a compact gaming-tablet identity awaiting a reliable official page for the exact submitted model",
    audience: "users interested in portable Legion hardware for games, streaming, and touch interaction",
  },
  "oneplus-ace6t": {
    name: "OnePlus Ace6T",
    device: "phone",
    focus: "a fast display, high-capacity battery, and rugged protection tuned for performance-led use",
    audience: "gaming-oriented users who value responsive visuals, rapid charging, and durable construction",
    verifiedSummary:
      "OnePlus lists a 6.83-inch 1.5K display at up to 165Hz, an 8300mAh battery, 100W charging, and IP66, IP68, IP69, and IP69K ratings.",
    highlights: ["6.83-inch 1.5K display", "Up to 165Hz refresh rate", "8300mAh battery", "100W wired charging", "IP66, IP68, IP69, and IP69K"],
    specifications: [
      specification("Display", "6.83-inch 1.5K, up to 165Hz"),
      specification("Memory technology", "LPDDR5X"),
      specification("Storage technology", "UFS 4.1"),
      specification("Rear cameras", "50MP main and 8MP secondary"),
      specification("Battery", "8300mAh"),
      specification("Charging", "100W wired"),
    ],
  },
  "oppo-a6t": {
    name: "OPPO A6T",
    device: "phone",
    focus: "a 120Hz display and large battery in a practical 4G everyday handset",
    audience: "users seeking smooth navigation, familiar Android functions, and dependable daily capacity",
    verifiedSummary:
      "OPPO specifies a 6.75-inch 120Hz LCD, Snapdragon 685, a 6500mAh battery, a 13MP rear camera, and ColorOS 15.",
    highlights: ["6.75-inch 120Hz display", "Snapdragon 685", "6500mAh battery", "ColorOS 15"],
    specifications: [
      specification("Display", "6.75-inch LCD, 1570 × 720, up to 120Hz"),
      specification("Processor", "Snapdragon 685"),
      specification("Cameras", "13MP + QVGA rear; 5MP front"),
      specification("Battery", "6500mAh"),
      specification("Network", "4G"),
      specification("Operating system", "ColorOS 15"),
    ],
  },
  "poco-c71": {
    name: "POCO C71",
    device: "phone",
    focus: "a large 120Hz display and straightforward Android Go configuration for essential tasks",
    audience: "value-conscious users handling calls, messages, media, and lightweight applications",
    verifiedSummary:
      "POCO specifies a 6.88-inch 120Hz display, Unisoc T7250, a 32MP rear camera, a 5200mAh battery, and Android 15 Go Edition.",
    highlights: ["6.88-inch 120Hz display", "32MP rear camera", "5200mAh battery", "Android 15 Go Edition"],
    specifications: [
      specification("Display", "6.88-inch, 1640 × 720, up to 120Hz"),
      specification("Processor", "Unisoc T7250"),
      specification("Cameras", "32MP rear; 8MP front"),
      specification("Battery", "5200mAh"),
      specification("Charging", "15W wired"),
      specification("Operating system", "Android 15 Go Edition"),
    ],
  },
  "poco-c81-pro": {
    name: "POCO C81 Pro",
    device: "phone",
    focus: "a large battery, simple camera setup, and basic ingress protection for routine use",
    audience: "customers comparing accessible POCO phones for communication and everyday applications",
    verifiedSummary:
      "POCO’s official support information confirms a 6000mAh battery, 15W charging, a 13MP rear camera, fingerprint recognition, and IP52 protection.",
    highlights: ["6000mAh battery", "15W wired charging", "13MP rear camera", "IP52 protection"],
    specifications: [
      specification("Rear cameras", "13MP main and QVGA secondary"),
      specification("Battery", "6000mAh"),
      specification("Charging", "15W wired"),
      specification("Security", "Fingerprint recognition"),
      specification("Durability", "IP52"),
    ],
  },
  "poco-f6": {
    name: "POCO F6",
    device: "phone",
    focus: "flagship-class processing, a fluid AMOLED display, and fast wired charging",
    audience: "performance-minded users who switch between gaming, photography, streaming, and daily apps",
    verifiedSummary:
      "POCO lists Snapdragon 8s Gen 3, a 120Hz Flow AMOLED display, a 50MP camera with OIS, a 5000mAh battery, and 90W charging.",
    highlights: ["Snapdragon 8s Gen 3", "120Hz Flow AMOLED display", "50MP main camera with OIS", "90W wired charging", "Gorilla Glass Victus"],
    specifications: [
      specification("Processor", "Snapdragon 8s Gen 3"),
      specification("Display", "Flow AMOLED, up to 120Hz"),
      specification("Rear camera", "50MP main with OIS"),
      specification("Front camera", "20MP"),
      specification("Battery", "5000mAh"),
      specification("Charging", "90W wired"),
    ],
  },
  "poco-f7": {
    name: "POCO F7",
    device: "phone",
    focus: "high-end mobile performance, a broad 1.5K display, and strong battery capacity",
    audience: "enthusiasts seeking a responsive POCO handset for games, content, and multitasking",
    verifiedSummary:
      "POCO specifies Snapdragon 8s Gen 4, a 6.83-inch 1.5K 120Hz AMOLED display, a 6500mAh battery with 90W charging, and IP68.",
    highlights: ["Snapdragon 8s Gen 4", "6.83-inch 1.5K 120Hz AMOLED", "6500mAh battery", "90W wired charging", "IP68 resistance"],
    specifications: [
      specification("Processor", "Snapdragon 8s Gen 4"),
      specification("Display", "6.83-inch 1.5K AMOLED, up to 120Hz"),
      specification("Rear camera", "50MP main with OIS"),
      specification("Battery", "6500mAh"),
      specification("Charging", "90W wired"),
      specification("Durability", "IP68"),
    ],
  },
  "poco-m8-5g": {
    name: "POCO M8 5G",
    device: "phone",
    focus: "a 120Hz AMOLED display, 5G connection, and balanced midrange hardware",
    audience: "everyday users wanting smooth visuals, current connectivity, and practical charging",
    verifiedSummary:
      "POCO documents a 6.77-inch 120Hz AMOLED display, Snapdragon 6 Gen 3, a 50MP camera, a 5520mAh battery, and 45W charging.",
    highlights: ["6.77-inch 120Hz AMOLED display", "Snapdragon 6 Gen 3", "50MP rear camera", "5520mAh battery", "5G connectivity"],
    specifications: [
      specification("Display", "6.77-inch AMOLED, up to 120Hz"),
      specification("Processor", "Snapdragon 6 Gen 3"),
      specification("Rear camera", "50MP main"),
      specification("Battery", "5520mAh"),
      specification("Charging", "45W wired"),
      specification("Network", "5G"),
    ],
  },
  "poco-m8-pro-5g": {
    name: "POCO M8 Pro 5G",
    device: "phone",
    focus: "a high-resolution AMOLED display, fast charging, and comprehensive water-resistance ratings",
    audience: "users seeking capable midrange performance for entertainment, imaging, and connected work",
    verifiedSummary:
      "POCO lists Snapdragon 7s Gen 4, a 6.83-inch 1.5K 120Hz AMOLED display, a 6500mAh battery, 100W charging, and four IP ratings.",
    highlights: ["Snapdragon 7s Gen 4", "6.83-inch 1.5K 120Hz AMOLED", "50MP main camera with OIS", "100W wired charging", "IP66, IP68, IP69, and IP69K"],
    specifications: [
      specification("Display", "6.83-inch 1.5K AMOLED, up to 120Hz"),
      specification("Processor", "Snapdragon 7s Gen 4"),
      specification("Rear cameras", "50MP main with OIS and 8MP secondary"),
      specification("Battery", "6500mAh"),
      specification("Charging", "100W wired"),
      specification("Network", "5G"),
    ],
  },
  "poco-m8s": {
    name: "POCO M8s",
    device: "phone",
    focus: "a submitted M-series identity that differs from the official M8s 5G naming",
    audience: "POCO customers who want the exact model designation confirmed before reviewing hardware details",
  },
  "poco-pad-m1": {
    name: "POCO Pad M1",
    device: "tablet",
    focus: "a large 2.5K display, expansive battery, and quad-speaker media experience",
    audience: "students, viewers, and mobile workers wanting a roomy Android tablet",
    verifiedSummary:
      "POCO specifies a 12.1-inch 2.5K 120Hz display, Snapdragon 7s Gen 4, a 12000mAh battery, quad speakers, and expandable storage.",
    highlights: ["12.1-inch 2.5K 120Hz display", "Snapdragon 7s Gen 4", "12000mAh battery", "Quad speakers", "Expandable storage up to 2TB"],
    specifications: [
      specification("Display", "12.1-inch 2.5K, up to 120Hz"),
      specification("Processor", "Snapdragon 7s Gen 4"),
      specification("Battery", "12000mAh"),
      specification("Audio", "Quad speakers"),
      specification("Expandable storage", "Up to 2TB"),
    ],
  },
  "poco-x7-pro": {
    name: "POCO X7 Pro",
    device: "phone",
    focus: "upper-midrange processing, a 1.5K AMOLED display, and rapid wired charging",
    audience: "users pursuing fast games, fluid media, and stabilized everyday photography",
    verifiedSummary:
      "POCO lists Dimensity 8400-Ultra, a 6.67-inch 1.5K 120Hz AMOLED display, a 50MP camera with OIS, a 6000mAh battery, and 90W charging.",
    highlights: ["Dimensity 8400-Ultra", "6.67-inch 1.5K 120Hz AMOLED", "50MP main camera with OIS", "6000mAh battery", "90W wired charging"],
    specifications: [
      specification("Processor", "Dimensity 8400-Ultra"),
      specification("Display", "6.67-inch 1.5K AMOLED, up to 120Hz"),
      specification("Rear cameras", "50MP main with OIS and 8MP secondary"),
      specification("Battery", "6000mAh"),
      specification("Charging", "90W wired"),
      specification("Network", "5G"),
    ],
  },
  "poco-x8-pro-max": {
    name: "POCO X8 Pro Max",
    device: "phone",
    focus: "flagship-tier processing, an exceptionally large battery, and a spacious 1.5K display",
    audience: "power users wanting extended capacity for games, streaming, and demanding applications",
    verifiedSummary:
      "POCO specifies Dimensity 9500s, a 6.83-inch 1.5K 120Hz AMOLED display, an 8500mAh battery with 100W charging, and IP68.",
    highlights: ["Dimensity 9500s", "6.83-inch 1.5K 120Hz AMOLED", "8500mAh battery", "100W wired charging", "IP68 resistance"],
    specifications: [
      specification("Processor", "Dimensity 9500s"),
      specification("Display", "6.83-inch 1.5K AMOLED, up to 120Hz"),
      specification("Rear cameras", "50MP main with OIS and 8MP secondary"),
      specification("Battery", "8500mAh"),
      specification("Charging", "100W wired"),
      specification("Network", "5G"),
    ],
  },
  "poco-x8-pro": {
    name: "POCO X8 Pro",
    device: "phone",
    focus: "responsive performance, a compact 1.5K AMOLED display, and high-speed charging",
    audience: "mobile gamers and media users who want capable hardware in a manageable form",
    verifiedSummary:
      "POCO lists Dimensity 8500-Ultra, a 6.59-inch 1.5K 120Hz AMOLED display, a 6500mAh battery with 100W charging, and a 50MP OIS camera.",
    highlights: ["Dimensity 8500-Ultra", "6.59-inch 1.5K 120Hz AMOLED", "50MP main camera with OIS", "6500mAh battery", "100W wired charging"],
    specifications: [
      specification("Processor", "Dimensity 8500-Ultra"),
      specification("Display", "6.59-inch 1.5K AMOLED, up to 120Hz"),
      specification("Rear camera", "50MP main with OIS"),
      specification("Battery", "6500mAh"),
      specification("Charging", "100W wired"),
      specification("Network", "5G"),
    ],
  },
  "redmi-15-5g": {
    name: "Redmi 15 5G",
    device: "phone",
    focus: "a very large 144Hz display, 5G access, and a high-capacity battery",
    audience: "everyday users who favor expansive viewing and fewer charging interruptions",
    verifiedSummary:
      "Redmi specifies Snapdragon 6s Gen 3, a 6.9-inch FHD+ 144Hz display, a 7000mAh battery with 33W charging, a 50MP camera, and IP64.",
    highlights: ["6.9-inch FHD+ 144Hz display", "7000mAh battery", "50MP rear camera", "5G connectivity", "IP64 protection"],
    specifications: [
      specification("Processor", "Snapdragon 6s Gen 3"),
      specification("Display", "6.9-inch FHD+, up to 144Hz"),
      specification("Rear camera", "50MP main"),
      specification("Battery", "7000mAh"),
      specification("Charging", "33W wired"),
      specification("Durability", "IP64"),
    ],
  },
  "redmi-15c-5g": {
    name: "Redmi 15C 5G",
    device: "phone",
    focus: "accessible 5G connectivity with regional specifications still requiring reconciliation",
    audience: "value-focused users monitoring Redmi’s connected everyday phone range",
  },
  "redmi-a5": {
    name: "Redmi A5",
    device: "phone",
    focus: "essential smartphone hardware, a large battery, and convenient side fingerprint access",
    audience: "first-time smartphone owners and practical users focused on basic daily tasks",
    verifiedSummary:
      "Redmi’s official specifications identify the Unisoc T7250 processor, a 5200mAh battery, 15W charging, and side-mounted fingerprint recognition.",
    highlights: ["Unisoc T7250 processor", "5200mAh battery", "15W wired charging", "Side fingerprint sensor"],
    specifications: [
      specification("Processor", "Unisoc T7250"),
      specification("Battery", "5200mAh"),
      specification("Charging", "15W wired"),
      specification("Security", "Side-mounted fingerprint sensor"),
    ],
  },
  "redmi-a7-pro": {
    name: "Redmi A7 Pro",
    device: "phone",
    focus: "a large 120Hz screen and substantial battery for practical daily Android use",
    audience: "budget-aware customers who value readable content, simple cameras, and steady capacity",
    verifiedSummary:
      "Redmi specifies a 6.9-inch 120Hz display, Unisoc T7250, a 6000mAh battery, 15W charging, and HyperOS 3.",
    highlights: ["6.9-inch 120Hz display", "Unisoc T7250 processor", "6000mAh battery", "HyperOS 3"],
    specifications: [
      specification("Display", "6.9-inch, up to 120Hz"),
      specification("Processor", "Unisoc T7250"),
      specification("Cameras", "13MP rear; 8MP front"),
      specification("Battery", "6000mAh"),
      specification("Charging", "15W wired"),
      specification("Network", "4G"),
    ],
  },
  "redmi-k90-max": {
    name: "Redmi K90 Max",
    device: "phone",
    focus: "a performance-oriented K-series identity listed officially in China without complete regional details",
    audience: "enthusiasts tracking Redmi’s upper-tier hardware and future market availability",
  },
  "redmi-k90-pro-max": {
    name: "Redmi K90 Pro Max",
    device: "phone",
    focus: "a premium K-series model whose Chinese listing does not establish a Philippine configuration",
    audience: "power users comparing upcoming Redmi flagships while regional specifications remain pending",
  },
  "redmi-k90": {
    name: "Redmi K90",
    device: "phone",
    focus: "a current K-series performance handset awaiting a complete verified specification set for this preview",
    audience: "customers following Redmi’s performance range for gaming and demanding mobile tasks",
  },
  "redmi-note-15": {
    name: "Redmi Note 15",
    device: "phone",
    focus: "a 108MP camera, AMOLED viewing, and a large battery for versatile everyday use",
    audience: "users balancing photography, entertainment, communication, and practical performance",
    verifiedSummary:
      "Redmi lists a 6.77-inch FHD+ AMOLED display, Helio G100-Ultra, a 108MP camera, a 6000mAh battery with 33W charging, and IP64.",
    highlights: ["6.77-inch FHD+ AMOLED display", "108MP main camera", "6000mAh battery", "33W wired charging", "IP64 protection"],
    specifications: [
      specification("Display", "6.77-inch FHD+ AMOLED"),
      specification("Processor", "Helio G100-Ultra"),
      specification("Rear camera", "108MP main"),
      specification("Battery", "6000mAh"),
      specification("Charging", "33W wired"),
      specification("Durability", "IP64"),
    ],
  },
  "redmi-note-15-pro-5g": {
    name: "Redmi Note 15 Pro 5G",
    device: "phone",
    focus: "a 200MP stabilized camera, 1.5K AMOLED display, and extensive ingress protection",
    audience: "mobile photographers and media users wanting capable 5G midrange hardware",
    verifiedSummary:
      "Redmi specifies Dimensity 7400-Ultra, a 6.83-inch 1.5K 120Hz AMOLED display, a 200MP OIS camera, a 6580mAh battery, and four IP ratings.",
    highlights: ["Dimensity 7400-Ultra", "6.83-inch 1.5K 120Hz AMOLED", "200MP main camera with OIS", "6580mAh battery", "IP66, IP68, IP69, and IP69K"],
    specifications: [
      specification("Display", "6.83-inch 1.5K AMOLED, up to 120Hz"),
      specification("Processor", "Dimensity 7400-Ultra"),
      specification("Rear cameras", "200MP main with OIS and 8MP secondary"),
      specification("Battery", "6580mAh"),
      specification("Charging", "45W wired"),
      specification("Network", "5G"),
    ],
  },
  "redmi-pad-2-4g": {
    name: "Redmi Pad 2 4G",
    device: "tablet",
    focus: "an 11-inch high-resolution display, mobile connectivity, and expandable storage",
    audience: "learners and media viewers who need a connected tablet beyond Wi‑Fi coverage",
    verifiedSummary:
      "Redmi specifies an 11-inch 2.5K 90Hz display, Helio G100-Ultra, a 9000mAh battery, dual-SIM 4G, and storage expansion up to 2TB.",
    highlights: ["11-inch 2.5K 90Hz display", "Dual-SIM 4G", "9000mAh battery", "Expandable storage up to 2TB"],
    specifications: [
      specification("Display", "11-inch, 2560 × 1600, up to 90Hz"),
      specification("Processor", "Helio G100-Ultra"),
      specification("Battery", "9000mAh"),
      specification("Charging", "18W wired"),
      specification("Network", "Dual-SIM 4G"),
      specification("Expandable storage", "Up to 2TB"),
    ],
  },
  "redmi-pad-2-se": {
    name: "Redmi Pad 2 SE",
    device: "tablet",
    focus: "an accessible tablet identity officially listed in China but not fully specified for this catalog",
    audience: "families and students monitoring practical Redmi tablets for entertainment and study",
  },
  "redmi-turbo-4-pro": {
    name: "Redmi Turbo 4 Pro",
    device: "phone",
    focus: "a performance-branded Redmi handset represented by two images while regional facts remain incomplete",
    audience: "mobile gamers comparing Turbo-series models before an exact local release is established",
  },
  "redmi-turbo-4": {
    name: "Redmi Turbo 4",
    device: "phone",
    focus: "a Turbo-series performance identity awaiting an exact official specification record for this market",
    audience: "enthusiasts who value responsive hardware but require verified regional details",
  },
  "redmi-turbo-5-max": {
    name: "Redmi Turbo 5 Max",
    device: "phone",
    focus: "an upper-tier Turbo identity listed by Redmi in China without confirmed local specifications",
    audience: "performance-focused users tracking high-capacity Redmi phones and future releases",
  },
  "samsung-galaxy-a07-lte": {
    name: "Samsung Galaxy A07 LTE",
    device: "phone",
    focus: "a smooth 90Hz display, practical 50MP camera, and long software-support commitment",
    audience: "everyday Android users seeking familiar Samsung software and straightforward LTE hardware",
    verifiedSummary:
      "Samsung Philippines lists a 6.7-inch 90Hz display, Helio G99, a 50MP camera, IP54 protection, and six operating-system upgrades.",
    highlights: ["6.7-inch 90Hz display", "Helio G99 processor", "50MP main camera", "IP54 protection", "Six OS upgrades"],
    specifications: [
      specification("Display", "6.7-inch, up to 90Hz"),
      specification("Processor", "Helio G99"),
      specification("Rear camera", "50MP main"),
      specification("Network", "LTE"),
      specification("Operating system", "One UI 7"),
      specification("Durability", "IP54"),
    ],
  },
  "tecno-camon-50-ultra": {
    name: "TECNO Camon 50 Ultra",
    device: "phone",
    focus: "a camera-oriented Camon identity whose submitted name differs from TECNO’s official 5G listing",
    audience: "mobile imaging fans waiting for exact model and regional confirmation",
  },
  "tecno-pova-curve-2": {
    name: "TECNO Pova Curve 2",
    device: "phone",
    focus: "a curved Pova-series identity that omits the 5G suffix used on TECNO’s official page",
    audience: "design-conscious performance users seeking an exact match before comparing hardware",
  },
  "tecno-pova-curve": {
    name: "TECNO Pova Curve",
    device: "phone",
    focus: "a slim curved-display Pova identity whose official counterpart carries a different 5G model name",
    audience: "users interested in distinctive TECNO performance phones pending identity reconciliation",
  },
  "tecno-pova-7": {
    name: "TECNO Pova 7",
    device: "phone",
    focus: "a high-refresh display, very large battery, and gaming-oriented everyday performance",
    audience: "mobile players and heavy media users who prioritize screen fluidity and capacity",
    verifiedSummary:
      "TECNO specifies Helio G100 Ultimate, a 6.78-inch FHD+ 120Hz display, a 7000mAh battery with 45W charging, and dual speakers.",
    highlights: ["6.78-inch FHD+ 120Hz display", "Helio G100 Ultimate", "7000mAh battery", "45W wired charging", "Dual speakers"],
    specifications: [
      specification("Display", "6.78-inch FHD+, up to 120Hz"),
      specification("Processor", "Helio G100 Ultimate"),
      specification("Cameras", "108MP + 2MP rear; 8MP front"),
      specification("Battery", "7000mAh"),
      specification("Charging", "45W wired"),
      specification("Operating system", "Android 15"),
    ],
  },
  "tecno-spark-50": {
    name: "TECNO Spark 50",
    device: "phone",
    focus: "a 120Hz screen, high-capacity battery, and protected construction for everyday use",
    audience: "practical users seeking smooth navigation, straightforward imaging, and extended capacity",
    verifiedSummary:
      "TECNO’s official regional page lists a 6.78-inch 120Hz display, a 7000mAh battery with 18W charging, a 50MP camera, and IP64.",
    highlights: ["6.78-inch 120Hz display", "7000mAh battery", "50MP rear camera", "IP64 protection"],
    specifications: [
      specification("Display", "6.78-inch, up to 120Hz"),
      specification("Rear camera", "50MP main"),
      specification("Battery", "7000mAh"),
      specification("Charging", "18W wired"),
      specification("Durability", "IP64"),
    ],
  },
  "tecno-spark-go-3": {
    name: "TECNO Spark Go 3",
    device: "phone",
    focus: "an entry Spark-series handset officially listed regionally without enough detail for this preview",
    audience: "value-conscious users following simple TECNO phones for communication and basic apps",
  },
  "tecno-spark-slim": {
    name: "TECNO Spark Slim",
    device: "phone",
    focus: "an exceptionally slim body, high-refresh AMOLED display, and balanced battery capacity",
    audience: "style-focused users who want lightweight-feeling hardware without abandoning screen fluidity",
    verifiedSummary:
      "TECNO lists a 5.93mm body, a 6.78-inch 1.5K 144Hz AMOLED display, Helio G200, a 5160mAh battery with 45W charging, and IP64.",
    highlights: ["5.93mm body", "6.78-inch 1.5K 144Hz AMOLED", "Helio G200", "45W wired charging", "IP64 protection"],
    specifications: [
      specification("Thickness", "5.93mm"),
      specification("Display", "6.78-inch 1.5K AMOLED, up to 144Hz"),
      specification("Processor", "Helio G200"),
      specification("Rear camera", "50MP main"),
      specification("Battery", "5160mAh"),
      specification("Charging", "45W wired"),
    ],
  },
  "vivo-y05": {
    name: "vivo Y05",
    device: "phone",
    focus: "a large 120Hz display, substantial battery, and IP65 protection for everyday essentials",
    audience: "practical users who prioritize readable content, battery capacity, and basic durability",
    verifiedSummary:
      "vivo Philippines lists a 6.74-inch HD+ 120Hz LCD, a 6500mAh battery, 8MP rear and 5MP front cameras, and IP65 protection.",
    highlights: ["6.74-inch 120Hz display", "6500mAh battery", "IP65 protection", "8MP rear camera"],
    specifications: [
      specification("Display", "6.74-inch HD+ LCD, up to 120Hz"),
      specification("Cameras", "8MP rear; 5MP front"),
      specification("Battery", "6500mAh"),
      specification("Durability", "IP65"),
    ],
  },
  "vivo-y11d": {
    name: "vivo Y11D",
    device: "phone",
    focus: "a high-capacity battery, fast wired charging, and protected everyday construction",
    audience: "users who need practical mobile capacity for communication, media, and daily routines",
    verifiedSummary:
      "vivo Philippines documents a 6500mAh battery, 44W charging, a 120Hz display, and IP65 protection.",
    highlights: ["6500mAh battery", "44W wired charging", "120Hz display", "IP65 protection"],
    specifications: [
      specification("Display", "Up to 120Hz"),
      specification("Battery", "6500mAh"),
      specification("Charging", "44W wired"),
      specification("Durability", "IP65"),
    ],
  },
  "xiaomi-17-pro-max": {
    name: "Xiaomi 17 Pro Max",
    device: "phone",
    focus: "a premium Xiaomi identity officially listed in China without a complete global specification set",
    audience: "flagship shoppers tracking Xiaomi’s largest Pro-series model and future regional plans",
  },
  "xiaomi-17-pro": {
    name: "Xiaomi 17 Pro",
    device: "phone",
    focus: "a premium compact flagship identity whose available official listing remains China-specific",
    audience: "enthusiasts monitoring Xiaomi’s Pro hardware before international details are confirmed",
  },
  "xiaomi-17t": {
    name: "Xiaomi 17T",
    device: "phone",
    focus: "a Leica camera system, 1.5K AMOLED display, and efficient high-end mobile performance",
    audience: "photography and media users seeking a fast, durable Xiaomi handset",
    verifiedSummary:
      "Xiaomi specifies Dimensity 8500-Ultra, a 6.59-inch 1.5K 120Hz AMOLED display, Leica triple cameras, a 6500mAh battery with 67W charging, and IP68.",
    highlights: ["Dimensity 8500-Ultra", "6.59-inch 1.5K 120Hz AMOLED", "Leica triple-camera system", "67W wired charging", "IP68 resistance"],
    specifications: [
      specification("Processor", "Dimensity 8500-Ultra"),
      specification("Display", "6.59-inch 1.5K AMOLED, up to 120Hz"),
      specification("Rear cameras", "50MP + 50MP + 12MP Leica system"),
      specification("Battery", "6500mAh"),
      specification("Charging", "67W wired"),
      specification("Durability", "IP68"),
    ],
  },
  "xiaomi-17": {
    name: "Xiaomi 17",
    device: "phone",
    focus: "compact flagship dimensions, Leica triple cameras, and flexible wired and wireless charging",
    audience: "power users wanting premium imaging and performance in a smaller handset",
    verifiedSummary:
      "Xiaomi lists Snapdragon 8 Elite Gen 5, a 6.3-inch display, three 50MP Leica rear cameras, a 6330mAh battery, 100W wired charging, and 50W wireless charging.",
    highlights: ["Snapdragon 8 Elite Gen 5", "Compact 6.3-inch display", "Triple 50MP Leica cameras", "100W wired charging", "50W wireless charging"],
    specifications: [
      specification("Processor", "Snapdragon 8 Elite Gen 5"),
      specification("Display", "6.3-inch"),
      specification("Rear cameras", "Triple 50MP Leica system with OIS"),
      specification("Battery", "6330mAh"),
      specification("Charging", "100W wired; 50W wireless"),
    ],
  },
  "xiaomi-17t-pro": {
    name: "Xiaomi 17T Pro",
    device: "phone",
    focus: "flagship processing, a 144Hz AMOLED display, and a versatile Leica camera system",
    audience: "demanding users moving between gaming, photography, video, and productive mobile work",
    verifiedSummary:
      "Xiaomi specifies Dimensity 9500, a 6.83-inch 1.5K 144Hz AMOLED display, Leica triple cameras, a 7000mAh battery, wired and wireless charging, and IP68.",
    highlights: ["Dimensity 9500", "6.83-inch 1.5K 144Hz AMOLED", "Leica triple-camera system", "100W wired and 50W wireless charging", "IP68 resistance"],
    specifications: [
      specification("Processor", "Dimensity 9500"),
      specification("Display", "6.83-inch 1.5K AMOLED, up to 144Hz"),
      specification("Rear cameras", "50MP + 50MP + 12MP Leica system"),
      specification("Battery", "7000mAh"),
      specification("Charging", "100W wired; 50W wireless"),
      specification("Network", "5G"),
    ],
  },
};

const shortTemplates = [
  ({ name, device, focus }: ContentSeed) =>
    `${name} is a ${device} preview centered on ${focus}, with exact Philippine availability still to be confirmed.`,
  ({ name, device, focus }: ContentSeed) =>
    `A ${device} preview for ${name}, bringing together ${focus} while GadgetMoTo verifies its final Philippine catalog details.`,
  ({ name, device, focus }: ContentSeed) =>
    `${name} offers a closer look at ${focus} in a non-purchasable ${device} preview pending local confirmation.`,
  ({ name, device, focus }: ContentSeed) =>
    `Explore ${name}, a coming-soon ${device} shaped around ${focus}, without unconfirmed local variants or purchase claims.`,
] as const;

const descriptionTemplates = [
  (seed: ContentSeed) =>
    `${seed.name} is presented as a ${seed.device} for ${seed.audience}. Its preview focuses on ${seed.focus}. ${seed.verifiedSummary ?? "An exact official specification page could not be confirmed for this submitted model, so detailed hardware claims are intentionally omitted."} GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.`,
  (seed: ContentSeed) =>
    `Designed with ${seed.audience} in mind, ${seed.name} is a coming-soon ${seed.device} emphasizing ${seed.focus}. ${seed.verifiedSummary ?? "Available official material does not provide a sufficiently exact match for the submitted identity, so this overview avoids unsupported component details."} This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.`,
  (seed: ContentSeed) =>
    `${seed.name} joins the preview catalog as a ${seed.device} aimed at ${seed.audience}. The current content highlights ${seed.focus}. ${seed.verifiedSummary ?? "Because no exact official source with complete model details was located, no processor, memory, camera, battery, or connectivity specification is inferred."} It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.`,
  (seed: ContentSeed) =>
    `This early look at ${seed.name} introduces a ${seed.device} suited to ${seed.audience}. Its identifiable direction is ${seed.focus}. ${seed.verifiedSummary ?? "The exact submitted model is not yet supported by a sufficiently detailed official source, so the specification area is deliberately withheld."} The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.`,
] as const;

const wordCount = (value: string) => value.trim().split(/\s+/).length;

export const upcomingProductContent: Readonly<
  Record<string, UpcomingProductContent>
> = Object.fromEntries(
  Object.entries(seeds).map(([id, seed], index) => {
    const shortDescription = shortTemplates[index % shortTemplates.length](seed);
    const description =
      descriptionTemplates[index % descriptionTemplates.length](seed);

    return [
      id,
      {
        shortDescription,
        description,
        highlights: seed.highlights ?? [],
        specifications: seed.specifications ?? [],
      },
    ];
  }),
);

const contentEntries = Object.entries(upcomingProductContent);

if (
  contentEntries.length !== 68 ||
  new Set(contentEntries.map(([id]) => id)).size !== 68 ||
  new Set(
    contentEntries.map(([, content]) =>
      content.shortDescription.toLocaleLowerCase().replace(/\s+/g, " ").trim(),
    ),
  ).size !== 68 ||
  new Set(
    contentEntries.map(([, content]) =>
      content.description.toLocaleLowerCase().replace(/\s+/g, " ").trim(),
    ),
  ).size !== 68 ||
  contentEntries.some(([, content]) => {
    const shortWords = wordCount(content.shortDescription);
    const descriptionWords = wordCount(content.description);

    return (
      shortWords < 18 ||
      shortWords > 35 ||
      descriptionWords < 60 ||
      descriptionWords > 130 ||
      (content.highlights.length > 0 &&
        (content.highlights.length < 3 || content.highlights.length > 6)) ||
      content.specifications.some(
        ({ label, value }) => !label.trim() || !value.trim(),
      )
    );
  })
) {
  throw new Error("Upcoming product description validation failed.");
}
