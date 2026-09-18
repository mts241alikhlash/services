# T030 Report

Date: 2026-09-14
Task: T030, US2 funding-source application use cases
Status: COMPLETE

## Scope

- Moved create, get, update, and delete use cases into `src/inventory/reference-data/funding-source/application/use-cases/`, with one operation per folder and file.
- Added plain `CreateFundingSourceInput` and `UpdateFundingSourceInput` files.
- Removed DTO imports from all funding-source application use cases.
- Mapped input fields explicitly to `FundingSourceCreateRepositoryInput` and `FundingSourceUpdateRepositoryInput` through the new repository port.
- Preserved nullable `description` mapping as `null` when omitted.
- Preserved search forwarding, repository return values, not-found behavior, and exact error message: `Funding Source with ID ${id} not found`.
- Updated funding-source controller use-case imports and metadata consumer repository import.
- Updated funding-source module to use only the repository token from `domain/repositories/funding-source.repository.ts`.
- Removed old funding-source use-case files and obsolete duplicate repository interface file.
- No DTO, controller, or adapter relocation. No schema, package, planning, or tasks changes. No subagents. No commit.

## Tests

Added focused real-behavior tests at:

`src/inventory/reference-data/funding-source/application/use-cases/funding-source-use-cases.spec.ts`

TDD red run failed because moved use-case modules did not exist yet. After implementation:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/funding-source/application/use-cases/funding-source-use-cases.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
exit code: 0
```

Focused funding-source suite:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/funding-source --runInBand
Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
exit code: 0
```

Application boot test:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=app.module.boots.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
exit code: 0
```

## Verification

Commands run from `inventory-service`:

```text
pnpm exec prettier --check "src/inventory/reference-data/funding-source/application/use-cases/**/*.ts" "src/inventory/reference-data/funding-source/funding-source.module.ts" "src/inventory/reference-data/funding-source/presentation/funding-source.controller.ts" "src/inventory/reference-data/use-cases/get-metadata.use-case.ts"
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

Old funding-source interface and flat use-case import scan:

```text
No files found
```

The service directory has no Git metadata, so `git status --short` could not run and no commit was created.
