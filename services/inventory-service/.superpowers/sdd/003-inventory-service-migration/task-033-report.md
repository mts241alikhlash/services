# T033 Report

Date: 2026-09-14
Task: T033, US2 funding-source tests and obsolete-directory cleanup
Status: COMPLETE

## Scope

- Added Prisma repository coverage at `src/inventory/reference-data/funding-source/infrastructure/persistence/prisma/prisma-funding-source.repository.spec.ts`.
- Covered case-insensitive code/name search, ascending name ordering with and without search, explicit list and lookup output mapping, null lookup results, explicit create/update input mapping, delete mapping, and propagated Prisma errors.
- Kept existing use-case coverage because it already proves explicit create/update mapping, search forwarding, not-found errors, delete behavior, and repository return values.
- Kept existing controller coverage because it already proves route delegation, routes, methods, permissions, guards, Swagger metadata, response metadata, query metadata, validation, UUID pipes, status codes, and denied permissions.
- Kept existing module coverage because it already proves `IFundingSourceRepository` resolves to `PrismaFundingSourceRepository`.
- Removed only verified-empty obsolete directories: `src/inventory/reference-data/funding-source/domain/interfaces/` and `src/inventory/reference-data/funding-source/use-cases/`.
- Production entity contract changed intentionally in `src/inventory/reference-data/funding-source/domain/entities/funding-source.entity.ts` to include `description` and `createdAt`; no other production behavior changed. No schema, package, or planning changes. T033 task bookkeeping was reconciled in `specs/003-inventory-service-migration/tasks.md`. No subagents. No commit.

## TDD Evidence

The new repository spec was run before final verification and passed:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/reference-data/funding-source/infrastructure/persistence/prisma/prisma-funding-source.repository.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
exit code: 0
```

The search-order expectation was then deliberately inverted. The test failed on the expected `desc` versus received `asc` query, proving the assertion detects the production behavior. The expectation was restored before final verification.

## Verification

Commands run from `inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/reference-data/funding-source --runInBand
Test Suites: 4 passed, 4 total
Tests:       22 passed, 22 total
exit code: 0
```

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/app.module.boots.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
exit code: 0
```

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/reference-data/use-cases/get-metadata.use-case.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
exit code: 0
```

```text
pnpm exec prettier --check "src/inventory/reference-data/funding-source/**/*.ts" "src/inventory/reference-data/use-cases/get-metadata.use-case.ts" "src/inventory/reference-data/use-cases/get-metadata.use-case.spec.ts"
All matched files use Prettier code style!
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

```text
pnpm run build
exit code: 0
```

## Final Review

Spec verdict: PASS. Quality verdict: PASS.

Final review verified:

- `InventoryFundingSourceEntity` and `FundingSourceRepositoryOutput` include runtime `description` and `createdAt` fields.
- Repository tests assert explicit output projection and exclude extra ORM field `legacyField`.
- Prisma errors propagate for `findMany`, `findById`, `create`, `update`, and `delete`.
- Existing use-case tests cover explicit input mapping, search forwarding, not-found errors, delete behavior, and repository results.
- Existing controller tests cover delegation, routes, permissions, guards, Swagger metadata, validation, UUID pipes, and status codes.
- Module token test plus app boot cover repository DI and Nest registration; no brittle module-internals test added.
- Obsolete `domain/interfaces/` and `use-cases/` directories are absent.
- T033 is marked `[x]` in `specs/003-inventory-service-migration/tasks.md`.

Evidence: funding-source tests `4` suites / `23` tests passed; app boot passed; metadata test passed; Prettier, ESLint, strict ESLint, typecheck, and build passed. No source or test files changed during final bookkeeping reconciliation.

Both obsolete directory paths were checked after cleanup and no longer exist. Jest emitted the existing Node `ExperimentalWarning: VM Modules is an experimental feature and might change at any time`; it did not affect results.

## Review Resolution

- Verified review finding: `InventoryFundingSourceEntity` omitted runtime `description` and `createdAt`, although the Prisma adapter mapped both and `InventoryFundingSourceResponseDto` exposed both.
- Extended only `src/inventory/reference-data/funding-source/domain/entities/funding-source.entity.ts` with `description: string | null` and `createdAt: Date`. No Prisma or presentation imports added.
- Strengthened the repository spec to assert the typed output contains both runtime fields and that an extra Prisma fixture field, `legacyField`, is not projected.
- Added repository error propagation coverage for `findById`, `create`, `update`, and `delete`; existing `findMany` propagation coverage retained.
- Module test was not expanded. Existing token-resolution test plus app boot proves Nest registration and DI without brittle direct metadata assertions; all four use cases and controller are registered in the production module.

### Red Evidence

The focused Jest run after adding assertions passed at runtime because Jest transpiles the suite without enforcing the TypeScript output contract. The required typecheck then failed on the missing contract fields:

```text
pnpm run typecheck
src/inventory/reference-data/funding-source/infrastructure/persistence/prisma/prisma-funding-source.repository.spec.ts(96,19): error TS2339: Property 'description' does not exist on type 'InventoryFundingSourceEntity'.
src/inventory/reference-data/funding-source/infrastructure/persistence/prisma/prisma-funding-source.repository.spec.ts(97,19): error TS2339: Property 'createdAt' does not exist on type 'InventoryFundingSourceEntity'.
exit code: 2
```

An initial red run also caught a test fixture typo (`and` versus `dan`) in the new assertion. That typo was corrected before the contract red run; no production code was changed for it.

### Green Evidence

After extending the domain entity and narrowing the nullable lookup result:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/reference-data/funding-source/infrastructure/persistence/prisma/prisma-funding-source.repository.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
exit code: 0
```

Final requested verification:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/reference-data/funding-source --runInBand
Test Suites: 4 passed, 4 total
Tests:       23 passed, 23 total
exit code: 0

pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/app.module.boots.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
exit code: 0

pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/reference-data/use-cases/get-metadata.use-case.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
exit code: 0

pnpm exec prettier --check "src/inventory/reference-data/funding-source/**/*.ts" "src/inventory/reference-data/use-cases/get-metadata.use-case.ts" "src/inventory/reference-data/use-cases/get-metadata.use-case.spec.ts"
All matched files use Prettier code style!
exit code: 0

pnpm run lint
exit code: 0

pnpm run lint:strict
exit code: 0

pnpm run typecheck
exit code: 0

pnpm run build
exit code: 0
```
