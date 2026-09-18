# T036 Report

Date: 2026-09-14
Task: T036, US2 location application use cases
Status: COMPLETE

## Scope

- Moved create, get, update, and delete use cases into `src/inventory/reference-data/location/application/use-cases/`, with one operation per folder and file.
- Added plain `CreateLocationInput` and `UpdateLocationInput` files for structured create/update operations.
- Removed DTO imports from all location application use cases.
- Mapped input fields explicitly to `LocationCreateRepositoryInput` and `LocationUpdateRepositoryInput` through the new repository port.
- Preserved nullable `building`, `room`, `rack`, and `description` mapping as `null` when omitted.
- Preserved search forwarding, repository return values, not-found behavior, and exact error message: `Location with ID ${id} not found`.
- Updated location controller and module use-case imports, and updated metadata use-case repository import to the new port.
- Removed old location use-case files and obsolete duplicate repository interface file.
- No DTO, controller, or adapter relocation. No schema, package, planning, or tasks changes. No subagents. No commit.

## Tests

Added focused real-behavior tests at:

`src/inventory/reference-data/location/application/use-cases/location-use-cases.spec.ts`

TDD red run failed because moved use-case modules did not exist yet. After implementation:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/location/application/use-cases/location-use-cases.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
exit code: 0
```

Focused location suite:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/location --runInBand
Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
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
pnpm exec prettier --check "src/inventory/reference-data/location/application/use-cases/**/*.ts" "src/inventory/reference-data/location/presentation/location.controller.ts" "src/inventory/reference-data/location/location.module.ts" "src/inventory/reference-data/use-cases/get-metadata.use-case.ts"
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

Location stale-layout and old repository interface import scans:

```text
No files found
```
