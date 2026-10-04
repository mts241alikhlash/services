# Quickstart: Condition Module Layering

## Preconditions

```bash
cd inventory-service
pnpm install
pnpm prisma:generate
```

No database is needed for use-case, repository-double, controller metadata, or static boundary tests. Live HTTP smoke tests need the service database.

## Focused verification

```bash
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=reference-data/condition
```

Expected result: condition tests pass without database boot.

## Static dependency verification

Inspect `src/inventory/reference-data/condition/` and confirm:

- `application/` imports only application/domain types and Nest injectable metadata.
- `domain/` imports no Prisma, HTTP DTO, controller, or infrastructure code.
- `presentation/http/` imports use cases and HTTP DTOs, not repositories.
- `infrastructure/persistence/prisma/` is the only condition location importing Prisma or `PrismaService`.
- `GetMetadataUseCase` imports from `condition/index.ts`, not an internal condition path.

## Full validation

```bash
pnpm run validate
```

Expected result: format check, lint, typecheck, strict lint, tests, and build exit zero.

## HTTP smoke scenarios

With inventory-service and its database running, verify:

1. Authorized list request returns `200`, current response shape, and name ascending.
2. Search matches code and name without case sensitivity.
3. Authorized create returns `201` and current response shape.
4. Authorized update returns `200` and preserves current `isUsable` behavior.
5. Authorized delete returns `204`.
6. Unknown update/delete IDs return the existing not-found response.
7. Missing permissions remain rejected.
