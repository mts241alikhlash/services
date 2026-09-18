# T054 Report

## Status

T054 complete.

## Scope

Created explicit circulation repository ports and plain contracts under:

- `src/inventory/circulation/domain/repositories/loan.repository.ts`
- `src/inventory/circulation/domain/repositories/history.repository.ts`
- `src/inventory/circulation/domain/repositories/transaction-type.repository.ts`
- `src/inventory/circulation/domain/repositories/circulation-capabilities.repository.ts`

## Caller Scan

- `CreateLoanUseCase` uses pending-status lookup, unit lookup, latest-loan lookup,
  and create-loan transaction processing.
- `ReturnLoanUseCase` uses loan lookup, status lookups, transaction-type lookup,
  and return-loan transaction processing.
- `GetLoansUseCase` uses loan pagination and query fields.
- `GetLoanByIdUseCase` uses loan lookup and not-found behavior.
- `GetHistoriesUseCase` uses history pagination and unit filtering.
- `LoanController` and `HistoryController` add no repository methods or fields.
- Approval currently reaches Prisma directly. No current approval caller consumes a
  circulation port, so no approval-specific method was added here.
- `inventory-unit-movement.steps.ts` accepts Prisma directly and has no
  circulation-port caller. Its future ownership contract remains T072/T074.

## Contracts

- `ILoanRepository` preserves `findAllLoans`, `findLoanById`, `createLoan`,
  `updateLoan`, `findLatestLoan`, `processCreateLoanTransaction`, and
  `processReturnLoanTransaction`.
- Loan query preserves `page`, `limit`, `keyword`, `statusId`, and `requesterId`.
- Loan outputs preserve loan, item, requester, status, workflow, and timestamp
  fields from the existing `LoanWithRelations` contract.
- Loan transaction inputs preserve unit IDs, unit status projections, pending and
  return status IDs, transaction type ID, requester/change actor IDs, loan number,
  return date, purpose, and per-item condition/note fields.
- `IHistoryRepository` preserves history pagination, `unitId` filtering, all
  history transition fields, actor, timestamp, and create input fields.
- `ITransactionTypeRepository` preserves transaction-type lookup by code and its
  `id`, `code`, and `name` projection.
- `ICirculationCapabilitiesRepository` isolates current status-by-code,
  status-by-system-key, and loanable-unit reads, including transaction flags and
  asset-name projections used by loan validation.
- No period or month query field exists in current circulation callers or DTOs;
  none was invented.

## Boundary Checks

- New files contain no Prisma, DTO, HTTP, or presentation imports.
- New files contain no `Partial`, generic base repository, or speculative method.
- Existing `domain/interfaces/circulation-repository.interface.ts`, adapters, use
  cases, DTOs, controllers, modules, shared helper, and index remain untouched for
  staged T055-T058 migration.
- No contract test was added. Existing circulation characterization tests cover
  current method arguments and response forwarding; no missing output field was
  found in the active plain contract.

## Verification

Command run from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/circulation --runInBand
Test Suites: 7 passed, 7 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        2.945 s
Ran all test suites matching inventory/circulation.
```

Static scan of `src/inventory/circulation/domain/repositories/` found zero
matches for `@prisma/client`, DTO imports, HTTP/presentation imports, `Partial`,
or `any`/`unknown` declarations.

## Corrective Review

Plain contracts retain loaded loan-item `unit` details and history
`unit`/`transactionType` details. `ProcessCreateLoanInput.units` remains the
narrow `{ id, statusId }` transaction projection.

Focused circulation verification after correction: 9 suites passed, 34 tests
passed. T068-T073 ownership redesign was not included.

No commit created.
