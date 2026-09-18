# T022 Evidence

Date: 2026-09-14

## Scope

Added characterization specs beside the five existing circulation use cases:

- `src/inventory/circulation/use-cases/create-loan.use-case.spec.ts`
- `src/inventory/circulation/use-cases/get-loans.use-case.spec.ts`
- `src/inventory/circulation/use-cases/get-loan-by-id.use-case.spec.ts`
- `src/inventory/circulation/use-cases/get-histories.use-case.spec.ts`
- `src/inventory/circulation/use-cases/return-loan.use-case.spec.ts`

Production use cases, DTOs, repository interfaces, controllers, modules, package files, schema, planning docs, and `tasks.md` were not changed.

## Characterized Behavior

### Create loan

- Looks up `LOAN_PENDING` before reading units.
- Throws `NotFoundException` with the current configuration message when pending status is missing.
- Delegates requested unit IDs to `findUnitsByIds`.
- Throws `BadRequestException` when returned unit count differs from requested count.
- Rejects each unit whose status does not allow transactions, preserving asset and unit-number message text.
- Looks up latest loan only after status and unit validation pass.
- Builds `LN-YYYYMMDD-NNNN` using today’s UTC date.
- Increments today’s latest sequence and starts at `0001` when no same-day loan exists.
- Constructs and delegates `processCreateLoanTransaction` parameters, including `Date` conversion, requester ID, pending status ID, original unit IDs, and repository unit rows.

### Get loans

- Forwards `page`, `limit`, `keyword`, `statusId`, and `requesterId` to `findAllLoans`.
- Preserves repository return value.
- Preserves explicit `undefined` fields when query is empty.

### Get loan by ID

- Delegates ID to `findLoanById`.
- Preserves found loan object.
- Throws `NotFoundException('Loan transaction not found.')` when repository returns `null`.

### Get histories

- Forwards `page`, `limit`, and `unitId` to `findAllHistories`.
- Preserves repository return value.
- Preserves explicit `undefined` fields when query is empty.

### Return loan

- Looks up loan before any reference data.
- Throws current not-found exception and skips reference lookups when loan is absent.
- Looks up `LOAN_RETURNED`, `AVAILABLE`, and `TX-LOAN-IN`.
- Aggregates all missing reference names in `InventoryReferenceDataMissingException`.
- Rejects loans with `actualReturnDate` using current duplicate-return message.
- Rejects return items whose unit is not among loan items.
- Constructs and delegates `processReturnLoanTransaction` parameters, including status IDs, transaction type ID, actor ID, loan number, and explicit item mapping from `returnedConditionId`/`notes` to `conditionId`/`note`.

## Test-First Evidence

Focused use-case command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/circulation/use-cases --runInBand
```

Result: 5 suites passed, 16 tests passed.

These are characterization tests, so existing production behavior is the expected green baseline. No production change was made to force a pass.

## Verification

Focused circulation tests:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/circulation --runInBand
```

Result: 7 suites passed, 26 tests passed.

Focused Prettier check:

```text
pnpm exec prettier --check "src/inventory/circulation/use-cases/*.spec.ts"
```

Result: passed.

ESLint:

```text
pnpm run lint
```

Result: passed with zero warnings.

Strict ESLint:

```text
pnpm run lint:strict
```

Result: passed with zero warnings.

TypeScript:

```text
pnpm run typecheck
```

Result: passed.

## Formatting Note

Initial repository-wide `pnpm run format:check` reported three files:

- The two new T022 specs, fixed with targeted Prettier formatting.
- Pre-existing `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`, not modified because it is outside T022 scope.

The targeted circulation spec formatting check passes. Repository-wide format remains blocked only by that unrelated pre-existing file.
