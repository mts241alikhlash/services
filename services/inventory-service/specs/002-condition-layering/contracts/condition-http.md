# Condition HTTP Contract

The migration preserves this existing contract. No endpoint, method, permission, DTO validation, response type, or status code changes are allowed.

| Method | Route | Permission | Success |
|---|---|---|---|
| GET | `/inventory/conditions` | `inventory-reference-data.read` | `200`, condition array |
| POST | `/inventory/conditions` | `inventory-reference-data.create` | `201`, condition response |
| PATCH | `/inventory/conditions/:id` | `inventory-reference-data.update` | `200`, condition response |
| DELETE | `/inventory/conditions/:id` | `inventory-reference-data.delete` | `204`, empty body |

## Request fields

Create accepts `code`, `name`, and optional `isUsable`. Update accepts the partial form. Existing class-validator constraints remain authoritative.

## Query behavior

Optional `search` matches `code` or `name` case-insensitively. Results remain ordered by `name` ascending.

## Error behavior

Update and delete of an unknown ID retain the current `NotFoundException` behavior. Authentication and permission guards remain unchanged.
