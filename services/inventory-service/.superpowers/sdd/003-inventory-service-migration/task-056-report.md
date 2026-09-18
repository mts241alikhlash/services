# T056 Report

## Status

T056 complete.

## Scope

Moved all five circulation use cases into:

- `src/inventory/circulation/application/use-cases/create-loan/`
- `src/inventory/circulation/application/use-cases/return-loan/`
- `src/inventory/circulation/application/use-cases/get-loans/`
- `src/inventory/circulation/application/use-cases/get-loan-by-id/`
- `src/inventory/circulation/application/use-cases/get-histories/`

Added plain application input files for create loan, return loan, loan query,
and history query operations. `GetLoanByIdUseCase` keeps its scalar ID input.

Use cases now depend on T054 ports:

- `ILoanRepository`
- `IHistoryRepository`
- `ITransactionTypeRepository`
- `ICirculationCapabilitiesRepository`

Repository payload mapping is explicit, with already-plain unit projections
forwarded unchanged to preserve transaction arguments. No DTO, presentation, Prisma, or
legacy `ICirculationRepository` imports remain under application use cases.

Preserved loan numbering, status and transaction-type lookups, unit existence
and transaction validation, pagination and query forwarding, approval-aware
create transaction behavior, return transaction behavior, not-found/errors,
and repository return values.

Updated only circulation consumer/spec imports needed after the move. DTOs,
controllers, module wiring shape, public exports, approval consumers, schema,
package files, planning artifacts, and task files remain unmoved and unchanged.

## Verification

Command run from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/circulation --runInBand
Test Suites: 8 passed, 8 total
Tests:       27 passed, 27 total
Snapshots:   0 total
```

Static checks:

- Nine application use-case/input files found under the new path.
- Zero DTO, presentation, Prisma, or legacy circulation repository imports under application use cases.
- Zero stale production use-case files under `src/inventory/circulation/use-cases/`.
- Zero stale circulation production imports from the old use-case path.

## Corrective Review

Create-loan maps capability rows to `{ id, statusId }` before calling
`processCreateLoanTransaction`; validation still uses full capability rows. The
successful use-case test asserts this transaction input boundary.

Focused circulation verification after correction: 9 suites passed, 34 tests
passed. T068-T073 ownership redesign was not included.

No subagents used. No commit created.
