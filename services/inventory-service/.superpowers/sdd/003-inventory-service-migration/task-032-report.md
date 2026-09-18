# T032 Report

Date: 2026-09-14
Task: T032, US2 funding-source module wiring
Status: COMPLETE

## Scope

- Confirmed `FundingSourceModule` wires `IFundingSourceRepository` to `PrismaFundingSourceRepository`, registers the moved application use cases, registers the moved HTTP controller, and exports the repository token.
- Added `src/inventory/reference-data/funding-source/index.ts` as the funding-source public port export.
- Updated `GetMetadataUseCase` to consume `IFundingSourceRepository` through the funding-source public export.
- Kept `ReferenceDataModule` imports and exports unchanged because `FundingSourceModule` was already imported and exported for metadata consumers.
- Added only a minimal `funding-source.module.spec.ts` module-token smoke test proving the abstract repository token resolves to the Prisma adapter.
- Removed no additional paths: no obsolete funding-source source references remained after T031.
- Complete funding-source use-case, repository, controller, and module wiring coverage remains owned by T033; this report does not claim that T033 coverage.
- No behavior, schema, package, or source/test changes beyond the minimal smoke test. No subagents. No commit.

## Tests

Funding-source tests, including the minimal T032 module-token smoke test and pre-existing T030/T031 coverage:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/reference-data/funding-source --runInBand
Test Suites: 3 passed, 3 total
Tests:       13 passed, 13 total
exit code: 0
```

Metadata use case:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/reference-data/use-cases/get-metadata.use-case.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
exit code: 0
```

Application boot:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/app.module.boots.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
exit code: 0
```

## Verification

Targeted source scan for old funding-source paths:

```text
rg -n -P "funding-source/(domain/interfaces|dto|use-cases|presentation/(?!http)|infrastructure/persistence/(?!prisma))" src
No output
exit code: 0
```

Targeted Prettier:

```text
pnpm exec prettier --check "src/inventory/reference-data/funding-source/**/*.ts" "src/inventory/reference-data/use-cases/get-metadata.use-case.ts" "src/inventory/reference-data/dto/response/metadata-response.dto.ts"
All matched files use Prettier code style!
exit code: 0
```

ESLint:

```text
pnpm run lint
exit code: 0
```

Strict ESLint:

```text
pnpm run lint:strict
exit code: 0
```

Typecheck:

```text
pnpm run typecheck
exit code: 0
```

Build:

```text
pnpm run build
exit code: 0
```

Jest emitted the existing Node `ExperimentalWarning: VM Modules is an experimental feature and might change at any time`; it did not affect test results.

## Reconciliation Evidence

- Marked only T032 as `[x]` in `specs/003-inventory-service-migration/tasks.md`.
- T033 remains `[ ]` and retains ownership of complete funding-source use-case, repository, controller, and module wiring test coverage.
- Appended this clarification and the ledger update without changing source, tests, package, schema, or other planning artifacts.
