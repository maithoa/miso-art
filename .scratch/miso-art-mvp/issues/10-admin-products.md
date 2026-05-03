# 10 — Admin product management

Status: needs-triage
Type: AFK

## What to build

Build the product management screen where the artist adds, edits, and removes postcards from the catalog. Includes image upload directly to Supabase Storage, freeform tag management, and the availability toggle. After this slice the artist can fully maintain their product catalog without touching the Supabase dashboard.

## Acceptance criteria

- [ ] `/admin/products` shows a table of all products with name, price, availability status, and edit/delete actions
- [ ] "Add product" opens a form with fields: name, description, price (entered in EUR, stored as cents), tags, image upload, availability toggle
- [ ] Image upload sends the file directly from the browser to Supabase Storage and saves the public URL to the product
- [ ] Tags field accepts freeform text entries (e.g. "birthday", "blue") that are stored as `TEXT[]`
- [ ] Tags can be added and removed individually in the form
- [ ] Editing a product pre-fills the form with existing values
- [ ] Saving an edit updates the product in Supabase and reflects in the table immediately
- [ ] Deleting a product removes it from Supabase and the table
- [ ] Availability toggle on the table row updates `is_available` in Supabase inline without opening the edit form
- [ ] Price is displayed in EUR (÷100) in the UI and stored as integer cents in the DB

## Blocked by

- 01 — Supabase schema + project config
- 08 — Admin auth + route protection
