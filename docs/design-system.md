# GadgetMoTo Design System

This document defines the Checkpoint 2B visual foundation. It supports future commerce experiences without prescribing page-specific layouts or behavior.

## Color roles

- **GadgetMoTo Blue (`#4C91C8`)** anchors brand symbols, highlights, and visual identity.
- **Accessible Action Blue (`#1D67C1`)** is the primary color for actionable controls with white text.
- **Bright Blue (`#247FE5`)** is an accent and should not replace Action Blue where text contrast is critical.
- **Deep Ink (`#171A20`)** is the primary text and high-contrast surface color.
- **Graphite (`#37363B`)** supports secondary dark elements.
- **Ice Blue (`#F3F9FE`)** and **Soft Sky (`#E3F2FC`)** create light backgrounds and selected states.
- White is the default content surface. Dedicated border, muted-text, success, warning, error, sale, and Messenger tokens provide restrained semantic feedback.
- Never communicate status by color alone; pair color with visible text.

## Typography roles

- Display, H1, H2, and H3 use the heading token and tight, balanced typography.
- Body large introduces sections or carries concise supporting messages.
- Body is the default interface and reading size.
- Small supports metadata and secondary details without hiding essential information.
- Eyebrow labels organize sections and use uppercase text with added letter spacing.

Space Grotesk and Inter are planned but currently represented by system fallbacks. Local font files or packages may be added in a later checkpoint. No remote fonts are loaded.

## Spacing approach

Spacing is mobile-first and fluid. Page gutters, component padding, and vertical section spacing use separate tokens so layouts remain spacious without making controls oversized. Prefer the shared container for consistent page width and keep long-form text within the reading-width token.

## Radius and shadow usage

- Small and medium radii belong to controls and compact content.
- Large and extra-large radii define cards and prominent sections.
- The fully rounded token is reserved for pills, badges, and primary commerce controls.
- Small shadows separate standard surfaces, medium shadows support interactive feedback, and large shadows are reserved for elevated priority. Avoid stacking multiple strong shadows.

## Button hierarchy

1. **Primary**: the highest-priority action in a region.
2. **Secondary**: a clear alternative without competing with the primary action.
3. **Ghost**: tertiary or low-emphasis actions.
4. **Messenger**: contact actions that explicitly open or represent Facebook Messenger.

Use one dominant primary action per decision area when practical. All buttons expose visible focus and disabled states and maintain an adequate touch target.

## Badge meanings

- **New**: recently introduced merchandise.
- **Sale**: explicit sale messaging.
- **In stock**: currently available.
- **Low stock**: availability is limited; no quantity is implied.
- **Preorder**: available to order before regular availability.
- **Unavailable**: not currently available; pair with Message Us where appropriate.

Badges describe known state only. Never invent inventory quantities or promotional claims.

## Logo usage

The official original JPEG at `public/brand/gadgetmoto-logo-original.jpg` must remain unchanged. The simplified web lockup uses a circular blue symbol, a white phone outline, the GadgetMoTo wordmark, and an optional slogan. It is an adaptive website lockup, not a replacement for the official logo. Preserve clear space around both marks and do not distort, recolor, crop, or add effects to the original asset.

## Accessibility principles

- Use semantic structure and programmatic labels.
- Maintain strong text and control contrast, especially for actionable states.
- Preserve visible keyboard focus and logical source order.
- Keep controls comfortably sized for touch interaction.
- Use responsive type and spacing without reducing essential content.
- Respect reduced-motion preferences and avoid motion-dependent meaning.
- Pair semantic colors with text labels or other non-color cues.

## Motion principles

Animation must remain restrained and commerce-focused. Use motion to clarify feedback, hierarchy, continuity, or state—not as an obstacle before product information or purchase actions. Prefer short durations and the shared easing token. Avoid continuous decorative movement, preserve input responsiveness, and provide a reduced-motion experience. Larger hero animation work belongs to a later checkpoint.
