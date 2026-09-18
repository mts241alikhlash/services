# T072 Report

## Status

T072 complete.

## Changes

- Added circulation-owned loan capabilities in
  `src/inventory/circulation/domain/repositories/loan.repository.ts`:
  - `ILoanCapabilityPort.findDetailsById(...)` for approval's pending-loan
    projection.
  - `ILoanCapabilityPort.updateStatus(...)` for approval loan status changes.
  - `ILoanItemCapabilityPort.findByLoanId(...)` for approval unit movement
    sequencing.
- Added `IHistoryCapabilityPort.record(...)` and its exact movement-history
  input fields in `history.repository.ts`.
- Added `ITransactionTypeCapabilityPort.findTransactionTypeByCode(...)` with
  the circulation-owned transaction-type ID projection.
- Restored `circulation-capabilities.repository.ts` with the existing
  `InventoryStatusRow` and `LoanableUnitRow` shapes, and exported its public
  capability contract from `circulation/index.ts`.
- Exported capability ports and plain contract types from `circulation/index.ts`
  for later module wiring.
- Kept existing circulation repository interfaces unchanged.

## Contract Review

- Loan detail projection preserves `id`, `loanNumber`, `purpose`,
  `expectedReturnDate`, loan-item IDs, unit IDs, unit number, and asset ID/name
  required by the current approval detail caller.
- Loan status mutation returns only the current loan ID and number required by
  later sequencing.
- Loan-item lookup returns only `unitId`, the field needed by movement callers.
- History recording preserves unit, transaction type, previous/new status,
  note, and actor fields used by the shared movement helper.
- Transaction-type lookup returns only its ID.
- No Prisma, DTO, HTTP, generic transaction, `Partial`, or speculative methods
  were added.

## Unchanged

- No adapter or caller rewiring. T073-T076 own that work.
- No Prisma access removal, shared helper move, schema, package, planning, or
  tasks changes.
- No contract test added. This slice adds declarations only; focused Jest suites
  verify existing behavior remains unchanged.
- No subagents used. No commit created.

## Verification

Commands run from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/circulation --runInBand
Test Suites: 9 passed, 9 total
Tests:       34 passed, 34 total

pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/approval --runInBand
Test Suites: 9 passed, 9 total
Tests:       55 passed, 55 total
```
