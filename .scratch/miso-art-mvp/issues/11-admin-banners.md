# 11 — Admin seasonal banners

Status: needs-triage
Type: AFK

## What to build

Build the seasonal banner management screen. The artist creates banners with a title, image, and date range, and can activate or deactivate them independently of their dates. After this slice the artist can prepare campaigns in advance and control when they appear on the gallery page.

## Acceptance criteria

- [ ] `/admin/banners` lists all banners with title, date range, and active status
- [ ] "Add banner" form has fields: title, image upload, start date, end date, active toggle
- [ ] Editing a banner pre-fills the form with existing values
- [ ] Saving an edit updates the banner in Supabase and reflects in the list immediately
- [ ] Active toggle on the list row updates `active` in Supabase inline without opening the edit form
- [ ] A banner can be deactivated even if today falls within its date range
- [ ] A banner can be activated even if today falls outside its date range (for advance preparation)
- [ ] Image upload sends directly to Supabase Storage and saves the public URL

## Blocked by

- 01 — Supabase schema + project config
- 08 — Admin auth + route protection
