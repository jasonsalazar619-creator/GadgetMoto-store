# GadgetMoTo Homepage Composition

Checkpoint 3A replaces the temporary confirmation page with a polished, static storefront composition. It uses Server Components, the approved design tokens, existing UI primitives, inline SVG, and CSS artwork only.

## Section order and purpose

1. **Announcement and navigation** — communicates payment, delivery, and pickup options while providing anchor navigation, static search/cart controls, and a safe external Messenger link.
2. **Upgrade Orbit hero** — establishes the campaign message and directs visitors to new arrivals or the comparison preview.
3. **New Arrivals** — presents eight verified phone records with known variants, prices, and supplied SRPs only.
4. **Browse by brand** — exposes twelve text-only brand tiles without reproducing trademark logos.
5. **Shop by budget** — presents four static budget entry points.
6. **Featured tablets** — presents four verified tablet records with supplied SRPs.
7. **Compare promo** — links to the functional three-product comparison experience.
8. **Payment and financing** — separates payment choices from provider-dependent financing options.
9. **Delivery** — communicates nationwide delivery, conditional same-day delivery, and the confirmed Barangay Sabang, Dasmariñas pickup location without inventing rates or timing.
10. **Why GadgetMoTo** — summarizes four supported trust points.
11. **Price-drop alert** — previews an accessible, disabled signup control without collecting data or showing success feedback.
12. **Footer** — repeats core navigation, location, payment context, Messenger access, current-year copyright, and availability messaging.

## Static interactions included

- Section-anchor navigation and hero calls to action.
- Safe new-tab Facebook Messenger links.
- Visual-only wishlist, brand, and budget controls; catalog search, global search, product comparison, and the shared cart are now functional.
- Restrained CSS hover and entrance transitions with a reduced-motion fallback.
- Functional product comparison alongside disabled price-alert actions with explicit coming-soon messaging.

## Functionality intentionally deferred

- Cart, wishlist, and comparison state.
- Product detail and catalog routes.
- Brand and budget filtering.
- Customer accounts, authentication, checkout, and order processing.
- Inventory, database, and admin content management.
- Maya or financing-provider integrations.
- Price-alert collection and notifications.
- GSAP or other advanced animation.

## Product data limitations

The homepage uses only the names, brands, category, RAM/storage variants, current prices, and SRPs supplied for this checkpoint. Product artwork is abstract CSS and intentionally replaceable. No ratings, reviews, quantities, colors, additional specifications, installment amounts, tax rates, warranties, or store policies are inferred.

## Future GSAP opportunities

The Upgrade Orbit composition could later support a carefully sequenced device reveal, orbital depth, and scroll-linked transitions. Motion should reinforce hierarchy and product focus, preserve immediate access to calls to action, and honor reduced-motion preferences. Product grids may use restrained staggered reveals only when they do not delay browsing.

## Mobile design considerations

- The header uses a compact horizontal anchor strip instead of a complex interactive menu.
- Hero content stacks above scalable CSS device art.
- Product and information grids collapse progressively from four columns to one or two.
- Controls maintain comfortable touch sizes and visible keyboard focus.
- Fluid type, page gutters, and section spacing avoid cramped or oversized mobile layouts.
- Decorative orbit artwork is hidden from assistive technology and contained to prevent horizontal overflow.

## Checkpoint 3B visual refinement

- Storefront-only containers now use a wider desktop canvas while headings and supporting copy retain constrained reading widths.
- The desktop header has more presence, larger hit areas, stronger lockup scale, and modestly increased navigation spacing; intermediate and mobile layouts retain the compact horizontal navigation treatment.
- The Upgrade Orbit hero uses a taller desktop stage, a larger overlapping phone-and-tablet composition, clearer orbit rings and information cards, stronger action hierarchy, and a two-column tablet layout that avoids excessive vertical height.
- Product grids use three columns at compact desktop widths and four on large screens. Cards have larger art areas, more prominent pricing, roomier content, focus-within feedback, and varied abstract device angles and gradient directions.
- Brand and budget tiles gained larger targets, directional feedback, restrained gradients, and abstract decorative forms without introducing trademark artwork or filtering behavior.
- Comparison slots now resemble abstract devices, while payment, delivery, trust, alert, and footer sections use more deliberate scale, padding, and scan-friendly typography.
- Section spacing was tightened into a varied but consistent storefront rhythm, with shorter mobile spacing and generous desktop breathing room.

## Checkpoint 4A GSAP hero motion

- Added `gsap` and `@gsap/react` and isolated all browser animation inside the hero-only `HeroMotion` Client Component. The homepage and `HeroSection` remain Server Components.
- The scoped entrance sequence reveals the background glow and orbital rings, eyebrow, accessible headline line wrappers, supporting copy, actions, tablet, main phone, and floating information cards. The primary content and calls to action arrive early in a short coordinated timeline.
- After the entrance completes, independent low-amplitude ambient tweens add slight vertical movement to the phone, tablet, and information cards, plus minimal ring drift. Durations differ to avoid synchronized or mechanical movement.
- Mobile motion uses smaller travel distances while retaining the same content order. Animation uses transforms and opacity only and does not affect layout.
- When `prefers-reduced-motion: reduce` is active, the GSAP timeline, ambient loops, and optional motion effects are not created. Server-rendered content remains immediately visible and functional because CSS does not hide initial states.
- Scoped GSAP contexts and media-query cleanup revert timelines when the hero unmounts or conditions change. Pointer-depth effects were intentionally omitted to keep transform ownership simple and efficient.
- ScrollTrigger, scroll-linked reveals, and animation outside the hero remain intentionally deferred.

## Checkpoint 4B motion audit and scroll control

- The audit confirmed that 4A intentionally omitted pointer depth and ScrollTrigger. Its initial offsets were also too restrained for an obvious page-load reveal, and entrance plus ambient motion shared device and card transform targets. The first desktop `matchMedia` condition issue had already been corrected before this checkpoint.
- The entrance now uses a clearly visible 0.9 ring scale, 45-pixel headline rise, offset tablet reveal, 70-pixel phone rise from 0.88 scale, and 0.85-scale card stagger while keeping the sequence under roughly 1.8 seconds.
- Each animated object now separates scroll, pointer, ambient, and visual entrance layers. This prevents timelines from overwriting one another while preserving the approved layout and server-rendered content.
- Fine-pointer, hover-capable desktops receive scoped `gsap.quickTo` depth: rings move least, tablet and phone move progressively more, and cards receive the strongest but still restrained response. Pointer exit eases all depth layers back to zero.
- A hero-only ScrollTrigger timeline scrubs from `top top` to `bottom top` without pinning. Text rises and fades, devices move at different depth rates, rings drift, and cards move outward and fade into the New Arrivals transition. Mobile uses shorter distances and a lighter text fade.
- Reduced-motion users skip entrance, ambient, pointer, and ScrollTrigger systems entirely. ScrollTrigger cleanup, media-query cleanup, pointer listener removal, and ambient tween termination all remain scoped to the hero boundary.
