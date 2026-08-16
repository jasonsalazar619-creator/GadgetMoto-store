# GadgetMoTo Admin Product-Management Schema

## Checkpoint status

Migration `20260731090806_admin_product_management_schema.sql` is deployed and
synchronized as migration 9. The previous eight deployed migrations remain
immutable and unchanged.

The secure Supabase Auth client foundation, `/admin/login`, protected admin
layout, dashboard shell, products placeholder, and logout are implemented.
No staff user, credential, or environment value is created by the repository.

## Existing-schema findings

The deployed schema already provides:

- `brands`, `products`, `product_variants`, and `product_images`
- integer-centavo current-price and SRP fields
- case-insensitive SKU uniqueness and product-scoped variant-name uniqueness
- product and variant ordering
- inventory, commerce, staff-profile, homepage-content, and audit tables
- Row Level Security on all application tables
- the server-only `storefront.catalog_products` read model
- a reusable controlled-search-path `public.set_updated_at()` trigger helper

The minimum missing capabilities are:

- full product descriptions and structured display-only highlights and
  specifications
- a safe Coming Soon representation that does not require a variant, SKU,
  price, or inventory
- product archival timestamps
- separate manufacturer-supported extended RAM
- image publication state, image update timestamps, and unique image paths
- administrator-only catalog policies
- a restricted product-image Storage bucket
- a server-only Coming Soon read model

No admin-notes field is added because it is not required by the approved
workflow and would expand sensitive-data handling.

## Unified product lifecycle

Live and Coming Soon items use `public.products`.

| Admin display status | Database representation | Purchasable |
| --- | --- | --- |
| Draft | `status = draft`, `is_public_preview = false` | No |
| Coming Soon | `status = draft`, `is_public_preview = true` | No |
| Active | `status = active`, `is_public_preview = false` | Yes, with an active variant |
| Archived | `status = archived`, `archived_at` present | No |

The existing enum values are not rewritten. Coming Soon uses a separate
boolean marker because a newly added PostgreSQL enum value cannot safely be
used by the same migration transaction for the required backfill.

Two source records have an unresolved category. `products.category` therefore
becomes nullable for incomplete drafts and previews, while an explicit check
continues to require a category for active products.

Deferred database constraints enforce:

- a Coming Soon preview cannot have an active purchasable variant
- an active product must have at least one active variant
- archived status and `archived_at` must agree

## Schema additions

### `public.products`

- `full_description text`
- `highlights jsonb`, constrained to an array
- `specifications jsonb`, constrained to an array
- `is_public_preview boolean`
- `archived_at timestamptz`
- description, visibility, active-category, and archive-state checks

### `public.product_variants`

- `extended_ram_gb smallint`, nullable and positive when supplied

Physical RAM remains in `ram_gb`. The two reviewed products that advertise
extended RAM receive `extended_ram_gb = 8`; their canonical SKUs are not
changed.

### `public.product_images`

- `is_published boolean`
- `updated_at timestamptz`
- unique `storage_path`
- `product_images_set_updated_at` trigger

The existing owner, nonblank alt text, nonnegative sort order, and one-primary
image constraints remain in force.

## Administrator authorization

`public.is_active_administrator()` is a controlled-search-path,
`SECURITY DEFINER` predicate. It returns true only when `auth.uid()` belongs
to an active `staff_profiles` row whose role is `administrator`.

The migration adds:

- active staff self-read for the caller's own authorization profile
- administrator select/insert/update for brands
- administrator select/insert/update and guarded delete for products
- administrator select/insert/update and guarded delete for variants
- administrator CRUD for image metadata
- administrator read of inventory levels
- administrator read and narrowly scoped insert of catalog audit entries

Corresponding table privileges are granted only to `authenticated`. RLS still
requires the active administrator predicate. No catalog write is granted to
`anon`, `public`, or an authenticated user without the required staff profile.
No public signup or staff account is created.

Trigger-only audit writers automatically record authenticated product,
variant, and image mutations. Each record contains only the staff actor,
entity and owning product identifiers, operation, changed field names, and
timestamp. Catalog values, descriptions, prices, image paths, credentials,
tokens, and uploaded content are not copied into the audit record.

Future trusted admin handlers must still:

1. verify the authenticated session server-side
2. verify the active administrator profile
3. validate an allowlisted request
4. execute the narrow write
5. rely on the database audit trigger and avoid creating a duplicate audit row
6. revalidate affected storefront routes

## Safe deletion

Archive is the normal removal workflow. It preserves product, image,
inventory, order, and audit relationships while removing the product from
public read models.

The guarded product-delete policy permits hard deletion only for a
non-preview draft with no:

- variants
- order items
- homepage placement
- product image metadata

The guarded variant-delete policy permits hard deletion only below a
non-preview draft product and only when there is no:

- order item
- inventory level or movement
- inventory reservation
- homepage placement
- variant image metadata

Existing foreign keys remain an additional safety boundary. Storage objects
must be safely removed through the future authorized image workflow before
their database metadata and owning draft can be permanently deleted.

## Product-image Storage

The migration configures a private Supabase Storage bucket named
`product-images`:

- maximum file size: 8 MB (`8,388,608` bytes)
- MIME types: JPEG, PNG, WebP, and AVIF
- required object path:
  `products/<existing-product-uuid>/<safe-file-name>.<approved-extension>`
- public storefront read only when a matching published image record belongs
  to a visible active or Coming Soon product
- upload, update, and delete only for an authenticated active administrator

The bucket is not an arbitrary public-write area. Repository image paths are
backfilled as catalog metadata; future managed uploads use the product-scoped
Storage convention.

The per-product image workflow is implemented. Administrators can add a
validated JPEG, PNG, WebP, or AVIF file, preview it before upload, choose any
published image as the primary storefront image, and remove any assignment.
The first upload becomes primary when the product has no images. Removing a
primary image atomically promotes the next published image when available; a
product may also have no image. Uploads use generated product-scoped object
names, an 8 MB application and bucket limit, and a 20-image limit that matches
the storefront read contract.

Migration `20260816113000_admin_product_gallery_storage.sql` adds the missing
authenticated-administrator read policy for managed objects in the existing
private bucket. Public Storage reads remain limited to published media owned
by visible active or Coming Soon products. Product-image insert and delete
events continue through the existing trigger-enforced audit log.

Migration `20260816153000_admin_product_primary_image_management.sql` adds two
authenticated-administrator functions for atomic primary-image selection and
safe image deletion with replacement promotion. Existing row-level policies,
least-privilege grants, and trigger-enforced image audit records remain active.

## Storefront read models

`storefront.catalog_products` remains the reviewed server-only purchasable
catalog view. Its original adapter columns retain their order and meaning.
Approved descriptions and primary-image metadata are appended, and archived
or preview products are excluded.

`storefront.coming_soon_products` is a new server-only read model containing
approved preview content and ordered published images. It exposes no SKU,
price, inventory quantity, staff profile, audit entry, payment data, or order
data.

Both models remain restricted to `gadgetmoto_storefront_reader`; they do not
create browser or Data API catalog access.

## Defensive backfill

The migration:

- verifies the exact 12 active canonical slugs
- verifies the exact 12 canonical SKUs without changing them
- rejects any source duplicate slug
- rejects any collision between an incoming slug and an existing product
- inserts exactly 68 Coming Soon previews
- inserts no variant, SKU, price, or inventory row for those previews
- inserts exactly 69 Coming Soon repository-image records
- inserts exactly 11 existing live-product repository-image records
- updates exactly two reviewed extended-RAM fields
- performs final Coming Soon count and non-purchasability checks

The database unique slug, case-insensitive SKU, image-path, and primary-image
constraints provide additional duplicate protection. Migration history is the
one-time execution authority; unexpected pre-existing incoming slugs cause a
failure instead of silently duplicating or overwriting catalog data.

## Deployment record

Migration version `20260731090806` is confirmed in local and remote migration
history. The deployed catalog contains the reviewed 12 live products and 68
Coming Soon previews. Administrator policies, guarded deletion, audit
triggers, restricted Storage configuration, and read models are live.

## Deferred application work

The following remain intentionally deferred:

- product list, product editor, and draft-creation UI
- autosave and server-side admin handlers
- Storage upload, replace, reorder, and deletion workflows
- storefront consumption of the added descriptions, images, and Coming Soon view
- route revalidation after approved admin changes
