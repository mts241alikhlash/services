# Data Model: Category Module Layering

This feature changes code organization only. Database schema and persisted data do not change.

## Inventory Category

Existing persistence/domain shape:

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Existing identifier, supplied by persistence. |
| `code` | `string` | Searchable category code. |
| `name` | `string` | Searchable and ascending sort field. |
| `depreciationRatePercent` | `number` or absent | Existing create/update field. |
| `deletedAt` | `Date` or `null` | Existing persistence field where returned by the model. |

## Boundary Types

The module keeps three distinct type surfaces:

| Surface | Location | Purpose |
|---|---|---|
| HTTP DTO | `presentation/http/dto/` | Request validation and Swagger metadata. |
| Application input | `application/use-cases/<operation>/` | Plain input consumed by one use case. |
| Repository input/output | `domain/repositories/category.repository.ts` | Persistence-independent port contract. |

## Relationships

- Category is a reference-data aggregate owned by inventory-service.
- No cross-service relationship changes.
- No category module caller inside `src/inventory/` is expected for this slice.

## State Changes

None. Existing create, update, and delete behavior remains authoritative.
