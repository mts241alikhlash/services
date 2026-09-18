# T029 Report

Date: 2026-09-14
Task: T029, US2 funding-source Prisma adapter
Status: COMPLETE

## Scope

- Moved the adapter to `src/inventory/reference-data/funding-source/infrastructure/persistence/prisma/prisma-funding-source.repository.ts`.
- Updated only `funding-source.module.ts` import/provider references required by the move.
- Removed the old flat adapter path.
- Changed the adapter class name to `PrismaFundingSourceRepository` to match the target layout.
- Switched the adapter to the T028 repository port at `domain/repositories/funding-source.repository.ts`.
- Mapped `findMany`, `findById`, `create`, `update`, and `delete` outputs explicitly.
- Mapped create and update repository inputs explicitly to Prisma data objects.
- Preserved case-insensitive code/name search, ascending name order, ID lookup, CRUD calls, and uncaught Prisma error behavior.
- Preserved `description` and `createdAt` on runtime outputs for the existing response contract.

No schema, package, task, use-case, DTO, controller, or unrelated module changes. No subagents. No commit.

## Tests

No funding-source adapter test existed before T029. T033 owns new funding-source repository tests, so no test was added here.

Existing focused funding-source suite:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/funding-source --runInBand
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
exit code: 0
```

Adapter-test scan: no `infrastructure/persistence/**/*.spec.ts` file exists under funding-source.

## Verification

Commands run from `inventory-service`:

```text
pnpm exec prettier --check "src/inventory/reference-data/funding-source/infrastructure/persistence/prisma/prisma-funding-source.repository.ts" "src/inventory/reference-data/funding-source/funding-source.module.ts"
All matched files use Prettier code style.
exit code: 0
```

```text
pnpm run lint
exit code: 0
```

```text
pnpm run lint:strict
exit code: 0
```

```text
pnpm run typecheck
exit code: 0
```

Repository-wide `pnpm run format:check` remains blocked by pre-existing unrelated formatting debt:

```text
src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts
Code style issues found in the above file.
exit code: 1
```

The two T029 files pass targeted Prettier verification above.

## Wiring Fix Evidence

T029 wiring defect fixed: `funding-source.module.ts` now imports
`IFundingSourceRepository` from
`domain/repositories/funding-source.repository.js`, matching the adapter and
T028 port. The obsolete interface file remains untouched for T030/T032
coordination. No module wiring test was added because no funding-source module
test exists and existing repository/module patterns do not require one for this
inspection-only correction.

## P1 Staged-Wiring Ruling

The prior wiring correction was too early. T030 has not moved the current use
cases, which still inject `IFundingSourceRepository` from
`domain/interfaces/funding-source-repository.interface.js`. The module now
keeps that old token in `providers` and `exports`, while
`PrismaFundingSourceRepository` remains the provider class implementing the new
T028 port. This avoids an unresolved Nest dependency without adding duplicate
providers or compatibility abstractions. T030/T032 must switch use-case imports
and module wiring together.

The existing `src/app.module.boots.spec.ts` is the app boot proof for dependency
resolution; no new module test was added.
