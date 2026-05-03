# 04 — Tag filter + search

Status: needs-triage
Type: AFK

## What to build

Add a search bar and tag filter pills above the gallery. Both filter the already-fetched products array in memory — no extra DB calls. Search matches product name, description, and tags. Tag pills are derived from the union of all tags across all products. Filters compose: both search and active pill must match.

## Acceptance criteria

- [ ] Search bar appears above the gallery grid
- [ ] Tag pills are derived dynamically from all products' `tags` arrays (no hardcoded list)
- [ ] Typing in search bar filters products by name, description, or tag in real time
- [ ] Clicking a tag pill filters to products containing that exact tag
- [ ] Active tag pill is visually distinct from inactive pills
- [ ] Multiple tag pills can be selected simultaneously; product must match all selected tags
- [ ] Search and tag filter compose: product must match both
- [ ] Clearing search and deselecting all pills restores the full product list
- [ ] Tests: all filtering combinations above

## Blocked by

- 03 — Product gallery
