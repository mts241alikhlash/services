# T042 Report

Date: 2026-09-14
Task: T042, US2 status application use cases
Status: COMPLETE

## Scope

- Moved create, get, update, and delete status use cases into `src/inventory/reference-data/status/application/use-cases/`, with one operation per folder and file.
- Added plain `CreateStatusInput` and `UpdateStatusInput` files for structured create/update operations.
- Removed DTO imports from all status application use cases.
- Mapped input fields explicitly to `StatusCreateRepositoryInput` and `StatusUpdateRepositoryInput` through the new repository port.
- Preserved create defaults: `allowTransactions` defaults to `true` and `systemKey` defaults to `null`.
- Preserved update behavior: `allowTransactions` defaults to `true`, omitted `systemKey` remains `undefined`, and explicit `null` clears the system key.
- Preserved search forwarding, repository return values, exact not-found messages, protected system-key delete error, and repository error propagation.
- Updated status controller use-case imports and the metadata consumer repository import to the new paths.
- Left DTOs, controller location, adapter, and module wiring unchanged for T043/T044. The old repository interface remains used by the module until T044 rewires it.
- No schema, package, planning, or tasks changes. No subagents. No commit.

## Tests

Added focused real-behavior tests at:

`src/inventory/reference-data/status/application/use-cases/status-use-cases.spec.ts`

TDD red run first failed after the test import path was corrected because the moved use-case modules did not exist yet. After implementation:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/status/application/use-cases/status-use-cases.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
exit code: 0
```

Focused status suite:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/status --runInBand
Test Suites: 3 passed, 3 total
Tests:       17 passed, 17 total
exit code: 0
```

## Verification

Commands run from `inventory-service`:

```text
pnpm exec prettier --check "src/inventory/reference-data/status/application/use-cases/**/*.ts" "src/inventory/reference-data/status/presentation/status.controller.ts" "src/inventory/reference-data/status/status.module.ts" "src/inventory/reference-data/use-cases/get-metadata.use-case.ts"
All matched files use Prettier code style!
exit code: 0
```

Status application stale import scan:

```text
No files found
```

Old flat status use-case directory scan:

```text
No files found
```
