# 20 — Extract filterProducts pure function

Status: needs-triage
Type: AFK

## What to build

Gallery's search + tag filter logic lives as a `useMemo` inside the render tree. It's a pure data transform but is coupled to React state, making it untestable without mounting the full component. Extract `filterProducts(products, { query, tag })` to `src/lib/products.js` so it can be tested exhaustively with zero React setup.

## Acceptance criteria

- [ ] `src/lib/products.js` exports `filterProducts(products, { query, tag })` returning the filtered array
- [ ] Filtering rules: `query` matches name, description, or any tag (case-insensitive substring); `tag` is exact-match on the tags array; both conditions must be met when both are set; empty/null values for either are treated as no filter
- [ ] `Gallery.jsx` delegates its `useMemo` filter to `filterProducts` — no inline filter logic remains in the component
- [ ] Unit tests cover: search by name, search by description, search by tag text, tag pill filter, combined search+tag, empty query returns all, no match returns empty array
- [ ] No existing tests broken

## Blocked by

- 19 (both write to `src/lib/products.js` — sequential to avoid merge conflict)
