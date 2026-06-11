# Table Management Decision

Permanent table management should be an admin-only configuration flow, separate
from the service-floor quick add flow.

## Decision

- The floor/header `+` should continue to create temporary overflow tables.
- Temporary tables are for active service only and can disappear when the table
  closes after payment.
- Permanent tables should be created, renamed, reordered, and removed from a
  dedicated admin-only Table Setup view.
- Permanent tables should be persistent across sessions and devices.
- The old Inside/Outside grouping should stay removed unless a future restaurant
  needs configurable zones.

## Data Model Direction

Permanent tables should eventually move out of hardcoded constants and into
Directus, likely as a `restaurant_tables` collection with fields such as:

- `id`
- `label`
- `sort_order`
- `active`

Deletion should probably be implemented as deactivation (`active: false`) so old
bills and analytics can still resolve historical table references safely.

## UI Direction

The homepage should render permanent configured tables plus any temporary
overflow tables. Staff should not manage permanent floor structure during
service; admins should handle that in Table Setup.
