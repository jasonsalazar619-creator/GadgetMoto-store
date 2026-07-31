# GadgetMoTo Admin Dashboard Guide

## Current checkpoint

The secure staff-authentication foundation, protected admin shell, and
validated product-management workflow are implemented. Product-image uploads
remain unavailable until their reviewed checkpoint.

Admin routes:

- `/admin/login` — staff email/password sign-in
- `/admin` — protected read-only dashboard shell
- `/admin/products` — protected searchable and filterable product list
- `/admin/products/new` — protected explicit draft-creation form
- `/admin/products/[id]` — protected product editor

There is no public signup, password-recovery flow, social login, or customer
account feature.

## Required configuration

The application reads these browser-safe configuration names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Values must be supplied outside Git for local development and Vercel. Do not
commit a populated environment file. A service-role key, database password,
and PostgreSQL connection string are not used by the admin browser flow.

When either required value is absent or invalid, `/admin/login` displays a
configuration-required state and disables credential submission. Protected
routes do not render admin content.

## Authentication architecture

The implementation uses:

- `@supabase/ssr` cookie-based authentication
- a browser client created only when requested
- a new server client per request
- `getAll` and `setAll` cookie adapters only
- `src/proxy.ts` for session refresh on `/admin/:path*`
- `auth.getClaims()` in the proxy for verified identity checks
- `auth.getUser()` in the server authorization layer for a fresh Auth user
- the deployed `staff_profiles` row as the authoritative role source

The proxy performs session refresh and anonymous navigation handling. It does
not make the final role decision. The protected server layout calls
`requireAuthenticatedAdmin()`, which requires:

1. a server-verified Supabase Auth user
2. a matching `staff_profiles.user_id`
3. `role = administrator`
4. `is_active = true`

Authentication alone does not grant admin access. User metadata and
browser-submitted role values are not trusted.

## Login behavior

The sign-in form accepts staff email and password and submits through a Server
Action. Errors always use the generic message:

> Unable to sign in. Check your credentials and try again.

The UI never reveals whether an email exists, whether it belongs to staff, or
why a staff profile was rejected. After successful credential verification,
the server verifies the active administrator profile before redirecting to
`/admin`. A successfully authenticated but unauthorized user is signed out of
the local session and receives the same generic failure.

## Logout

Logout is a POST-based Server Action available from desktop and mobile admin
navigation. It clears the local Supabase Auth session and redirects to
`/admin/login`. Tokens and cookie values are never returned to the UI or
logged.

## Protected-route behavior

- Anonymous `/admin` or `/admin/products` request: redirect to `/admin/login`
- Authenticated non-administrator: denied and redirected away from admin
- Missing active staff profile: denied
- Inactive staff profile: hidden by RLS and denied
- Active administrator: protected content rendered
- Active administrator visiting `/admin/login`: redirected to `/admin`

The dashboard loads exact product counts only through the authenticated
administrator's RLS-scoped Supabase client. If a count cannot be confirmed,
the UI displays an unavailable state instead of a fabricated zero.

## Creating the first administrator later

This repository does not create staff users. A project owner must perform the
following manually in the Supabase Dashboard:

1. Create or invite the staff user under Authentication.
2. Copy the resulting Auth user UUID without placing it in source control.
3. Create the corresponding `staff_profiles` record using that UUID as
   `user_id`.
4. Supply a reviewed display name.
5. Set `role` to `administrator`.
6. Set `is_active` to true.
7. Confirm login and protected-route behavior with that staff member.

Do not enable public signup. Do not place staff email addresses, passwords,
UUIDs, tokens, or project identifiers in documentation or Git.

## Product-management workflow

The product list loads after administrator verification and displays each
product once. It supports name, SKU, and slug search; brand, category, and
status filters; name or recently-updated sorting; and 20-item pagination.
Coming Soon records with no commercial variant display no fabricated SKU or
price.

New products begin as private drafts. The creation form requires a confirmed
name, existing active brand, and category. It proposes a unique slug, performs
a server uniqueness check, creates no SKU or price, and redirects to the
protected editor.

The editor supports:

- name, slug, brand, category, short description, and full description
- Draft, Coming Soon, and Active lifecycle changes
- featured state and nonnegative display order
- peso price and SRP input converted server-side to integer centavos
- badge and confirmed financing availability
- variant name, physical RAM, extended RAM, storage, and SKU
- structured label/value specifications

Existing canonical SKUs remain locked by default. SKU changes require
unlocking and explicit confirmation. Slug changes require a separate route
confirmation. Active products require complete descriptions, category, SKU,
variant, storage, and current price. Coming Soon products require descriptions
but may remain without a SKU, variant, price, or inventory.

Valid changes autosave after approximately 800 milliseconds. Only changed
database fields are written. Requests are serialized, newer edits remain
queued, stale responses do not replace current typing, and an explicit Save
button remains available. The editor announces Unsaved changes, Saving,
Saved, and Save failed states and warns before leaving with pending changes.

Archive is the normal removal operation. It requires confirmation, records the
archive timestamp, removes the product from public read models, and preserves
images, inventory, orders, and audit history. Permanent deletion is shown only
for a non-preview draft without a variant, requires the exact product name,
and remains subject to the deployed database dependency guard. Blocked
deletion recommends archive instead.

The deployed product and variant triggers automatically write safe audit
entries containing the administrator ID, entity ID, operation, changed field
names, and timestamp. Values, descriptions, prices, passwords, tokens,
cookies, and request bodies are not copied into audit records.

Successful mutations revalidate the homepage, catalog routes, Coming Soon,
affected detail routes, sitemap, shared root catalog payload, and admin
summaries. The server-only active and Coming Soon read models now supply
approved database edits when database catalog mode is enabled. Static mode
remains the build-safe and controlled fallback.

## Deferred product-management work

- product-image upload, replace, reorder, publication, and deletion
- inventory-level and movement management
- order-management tools

## Troubleshooting

- **Configuration required:** confirm both required public configuration names
  exist in the current environment; never paste their values into an issue or
  documentation.
- **Returned to login:** the Auth session was absent, invalid, expired, or
  could not be verified.
- **Returned to storefront:** the authenticated user did not have an active
  administrator staff profile.
- **Counts or product list unavailable:** authorization succeeded, but the catalog read could
  not be confirmed safely. No mutation is attempted.
- **Save failed:** the request was denied, invalid, conflicted, or could not be
  confirmed. Refresh before retrying; no raw database error is displayed.
- **Delete blocked:** the draft has a retained relationship and must be
  archived instead.

Raw Supabase errors, token values, cookie contents, SQL details, and project
identifiers must not be added to troubleshooting output.
