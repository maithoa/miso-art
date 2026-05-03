# 17 — Gumroad-style UI redesign

Status: needs-triage
Type: AFK

## What to build

Redesign the public-facing pages (Gallery, ProductCard, CartDrawer, Checkout, ThankYou, top nav) to match Gumroad's aesthetic: clean white backgrounds, generous whitespace, bold product-first typography, a minimal top nav, soft card shadows, and a signature pink/rose accent for primary actions. Admin pages are out of scope.

## Gumroad design language

- **Palette**: white background (#fff), near-black text (#1a1a1a), soft gray borders (#e5e5e5), pink/rose CTA (#ff90e8 or similar), green for success states
- **Typography**: large bold product names, lighter descriptive text, generous line height
- **Cards**: white, subtle border (not shadow-heavy), product image full-bleed top, clean bottom section with price prominent and large
- **Buttons**: rounded-full pill shape for primary CTAs, black fill with white text for "Add to cart", pink for checkout CTA
- **Nav**: minimal — logo left, cart icon right, no distracting links
- **Layout**: max-width container, generous padding, products breathe with more gap

## Acceptance criteria

- [ ] Top nav redesigned: white bar, brand name left, cart icon with count badge right — consistent across Gallery and Checkout
- [ ] ProductCard redesigned: full-bleed image, product name bold and large below, description in lighter gray, price prominent, "Add to cart" button pill-shaped black/dark
- [ ] Gallery page: cleaner header, search bar and tag pills styled to match Gumroad filter aesthetic (minimal, unobtrusive)
- [ ] CartDrawer redesigned: clean white slide-in panel, item rows with thumbnail + name + price, quantity controls minimal
- [ ] Checkout page: single-column clean form, Gumroad-style field labels and inputs, pink "Pay" CTA button
- [ ] ThankYou page: celebratory but minimal — large checkmark or success icon, clear confirmation text
- [ ] All Tailwind classes — no new CSS files unless strictly necessary
- [ ] Mobile-first: all redesigned components look correct at 375px width

## Blocked by

- 14 (cart drawer must exist before it can be redesigned)
