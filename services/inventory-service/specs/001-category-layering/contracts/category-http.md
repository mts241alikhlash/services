# Category HTTP Contract

This contract is preserved, not redesigned.

## Routes

| Method | Path | Permission | Expected status |
|---|---|---|---:|
| `GET` | `/inventory/categories` | `inventory-reference-data.read` | `200` |
| `POST` | `/inventory/categories` | `inventory-reference-data.create` | `201` |
| `PATCH` | `/inventory/categories/:id` | `inventory-reference-data.update` | `200` |
| `DELETE` | `/inventory/categories/:id` | `inventory-reference-data.delete` | `204` |

## Query and body behavior

- `GET` accepts optional `search` query text.
- Search matches `code` or `name`, case-insensitively.
- Results remain ordered by `name` ascending.
- Record inclusion remains unchanged from the current repository behavior; soft-delete filtering is outside this structural migration.
- Create and update retain current DTO validation and fields.
- Update and delete retain current not-found behavior.

## Non-contract changes

- File locations change.
- Use cases consume application inputs instead of HTTP DTO type names.
- Repository port moves to `domain/repositories/` and stops exposing Prisma types.
- None of these changes are visible to HTTP callers.
