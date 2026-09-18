# T055 Report

## Status

T055 complete.

## Scope

Moved circulation Prisma persistence into:

- `src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.ts`
- `src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.includes.ts`

Updated only existing circulation module wiring to import the moved adapter. No
use cases, DTOs, controllers, public exports, schema, package files, planning
artifacts, or task files were changed.

## Adapter Mapping

- `PrismaCirculationRepository` implements the four T054 circulation ports and
  retains the existing `ICirculationRepository` provider contract for later
  consumer migration.
- Loan outputs map scalar fields explicitly and map
  `InventoryLoanItem.notes` to port field `note`.
- History outputs map every transition, actor, note, and timestamp field
  explicitly.
- Transaction type outputs map only `id`, `code`, and `name`.
- Status outputs preserve `id`, `code`, `name`, `systemKey`, and
  `allowTransactions`.
- Loanable-unit outputs preserve `id`, `unitNumber`, `statusId`, asset name,
  and transaction availability.
- Loan and history pagination retain page, limit, skip, take, ordering, filters,
  and total-count behavior.
- Existing loan detail includes preserve item unit asset, location, status, and
  condition Prisma projections for the adapter query.
- Create/update/history input mapping is explicit. Prisma payloads do not cross
  the port boundary.
- Create-loan and return-loan transactions retain approval workflow handling,
  unit movement/history recording, reference-data errors, dates, notes, and
  existing error propagation.

## Tests

Added one focused adapter regression test:

- `src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.spec.ts`
- Proves explicit loan/item mapping and prevents legacy Prisma fields from
  escaping the adapter.

TDD red run failed at module resolution because moved production adapter did not
exist. Green run passed after implementation.

## Verification

Commands ran from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/circulation --runInBand
Test Suites: 8 passed, 8 total
Tests:       27 passed, 27 total
```

```text
pnpm run typecheck
$ tsc --noEmit
```

```text
pnpm exec prettier --check "src/inventory/circulation/infrastructure/persistence/prisma/*.ts" "src/inventory/circulation/circulation.module.ts"
All matched files use Prettier code style!
```

## Corrective Review

Mappers preserve nested data already loaded by Prisma: full loan-item unit
details from `LOAN_WITH_DETAILS_INCLUDE`, and history unit plus transaction-type
details from the history include.

Focused circulation verification after correction: 9 suites passed, 34 tests
passed. No schema or package changes made.

No commit created. No subagents used.
