# Module Boundary Contracts

These are internal contracts to be refined into exact interfaces by implementation tasks. They do not add HTTP endpoints.

## Reference-data exports

Each reference-data module exports its repository token and plain repository types through its public index. Consumers use only the exported port methods they need.

Required patterns:

- `ICategoryRepository`
- `IConditionRepository`
- `IFundingSourceRepository`
- `ILocationRepository`
- `IStatusRepository`

## Asset consumption ports

Asset application operations may consume narrow ports from reference-data modules for existence checks and lookup values. Asset does not query reference-data Prisma models directly.

## Circulation consumption ports

Circulation application operations may consume narrow asset, condition, location, status, and transaction-type capabilities. The circulation repository owns loan, loan-item, history, and transaction-type persistence only.

## Approval consequence ports

Approval application operations own approval workflow, instance, and log persistence. Approval invokes awaited circulation and asset capabilities for loan and unit consequences. These calls return explicit success/failure outcomes sufficient to expose retry or repair state; they do not share a Prisma transaction.

## Contract constraints

- Ports live in `domain/repositories/` or an explicit `integration/`/`platform/` boundary.
- Public Nest module classes are imported from their module files, not through barrels, where ESM cycle rules apply.
- Cross-module DTOs are narrow and append-only.
- No port exposes Prisma types, HTTP DTOs, or a whole foreign entity when a narrow projection is enough.
