# GadgetMoTo Admin Dashboard Guide

## Current checkpoint

The secure staff-authentication foundation and protected admin shell are
implemented. Product creation, editing, archival, image uploads, and autosave
remain unavailable until their reviewed checkpoints.

Admin routes:

- `/admin/login` — staff email/password sign-in
- `/admin` — protected read-only dashboard shell
- `/admin/products` — protected product-management placeholder

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

## Deferred product-management work

The `/admin/products` route is intentionally read-only. The following remain
pending:

- product list, search, filters, and paging
- explicit draft creation
- validated product and variant editing
- price and SRP editing in integer centavos
- archive and guarded permanent deletion
- product-image upload and gallery management
- autosave and save-status behavior
- public-route revalidation after approved changes

## Troubleshooting

- **Configuration required:** confirm both required public configuration names
  exist in the current environment; never paste their values into an issue or
  documentation.
- **Returned to login:** the Auth session was absent, invalid, expired, or
  could not be verified.
- **Returned to storefront:** the authenticated user did not have an active
  administrator staff profile.
- **Counts unavailable:** authorization succeeded, but the catalog read could
  not be confirmed safely. No mutation is attempted.

Raw Supabase errors, token values, cookie contents, SQL details, and project
identifiers must not be added to troubleshooting output.
