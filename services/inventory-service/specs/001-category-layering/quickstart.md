# Quickstart: Category Module Layering

## Preconditions

```bash
cd inventory-service
pnpm install
pnpm prisma:generate
```

No database is required for use-case unit tests. A database is required only for live HTTP verification.

## Focused verification

Run the category test path after each migration step:

```bash
pnpm exec jest --testPathPatterns=reference-data/category
```

Expected result: category tests pass without requiring a running database.

## Static dependency verification

Inspect imports under `src/inventory/reference-data/category/` and confirm:

- `application/` imports only application/domain types and Nest injectable metadata.
- `domain/` imports no Prisma, HTTP DTO, controller, or infrastructure code.
- `presentation/http/` imports use cases and HTTP DTOs, not repositories.
- `infrastructure/persistence/prisma/` is the only category location importing Prisma persistence types or `PrismaService`.

## Full validation

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run lint:strict
pnpm test
pnpm run build
```

Or:

```bash
pnpm run validate
```

Expected result: every command exits zero.

## HTTP smoke scenarios

With inventory-service and its database running, verify:

1. Authorized list request returns `200`, existing envelope, current record inclusion, and name ascending.
2. Search matches code and name without case sensitivity.
3. Authorized create returns `201` and the existing response shape.
4. Authorized update returns `200` and changes supplied fields only.
5. Authorized delete returns `204`.
6. Unknown update/delete IDs return the existing not-found response.
7. Missing permissions remain rejected.
