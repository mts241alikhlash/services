# T028 Report

## Scope

Created `src/inventory/reference-data/funding-source/domain/repositories/funding-source.repository.ts`.

The port defines:

- `FundingSourceCreateRepositoryInput` with `code`, `name`, and optional nullable `description`.
- `FundingSourceUpdateRepositoryInput` with explicit optional `code`, `name`, and nullable `description` fields.
- `FundingSourceRepositoryOutput` mapped to `InventoryFundingSourceEntity`.
- `IFundingSourceRepository` with existing `findMany`, `findById`, `create`, `update`, and `delete` methods.

No `Partial` type, Prisma type, DTO, HTTP type, adapter move, use-case move, controller move, or module change was added.

## Verification

Commands run from `inventory-service`:

```text
pnpm run typecheck
$ tsc --noEmit
exit code: 0
```

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/funding-source --runInBand
(node:9012) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        2.941 s
Ran all test suites matching inventory/reference-data/funding-source.
exit code: 0
```

No test was added because existing funding-source coverage passed and the port contains declarations only.
