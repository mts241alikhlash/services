# T059 Report

## Status

T059 complete.

## Scope

Added focused repository and module composition coverage for moved circulation:

- `src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.spec.ts`
- `src/inventory/circulation/circulation.module.spec.ts`

Existing use-case and controller characterization specs remain unchanged and
were not duplicated.

## Repository Coverage

`PrismaCirculationRepository` tests now cover:

- Explicit loan output mapping, including loan items and `notes` to `note`.
- Loan pagination, ordering, keyword, status, and requester predicates.
- Explicit history output mapping for every transition, actor, note, and
  timestamp field, with pagination and `unitId` filtering.
- Transaction-type, status-by-code, and status-by-system-key output mapping.
- Loanable-unit output mapping and `deletedAt: null` filtering.
- Lookup error propagation and create/return transaction error propagation.
- Existing loan-detail characterization coverage remains preserved.

No period or month filter exists in moved circulation inputs or DTOs, so no
period behavior was invented or tested.

## Module Wiring Coverage

`CirculationModule` tests prove:

- `ILoanRepository`, `IHistoryRepository`, `ITransactionTypeRepository`, and
  `ICirculationCapabilitiesRepository` all resolve to the same
  `PrismaCirculationRepository` instance.
- All five moved use cases and both moved controllers resolve from the module.

`circulation/index.ts` remains the public split-port export surface. Approval
and shared consumers were inspected; neither currently consumes a circulation
port. The stale `ICirculationRepository` remains untouched for T060.

## Verification

Command ran from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/circulation --runInBand
Test Suites: 9 passed, 9 total
Tests:       34 passed, 34 total
Snapshots:   0 total
Time:        8.152 s
Ran all test suites matching inventory/circulation.
```

## Corrective Review

Repository tests prove loaded nested loan-item unit, history unit, and history
transaction-type data survive adapter mapping. Create-loan success test proves
only narrowed unit rows reach transaction processing.

Focused circulation verification after correction: 9 suites passed, 34 tests
passed. No broad transaction-path suite or ownership redesign was added.

No schema, package, approval, shared, or stale-interface changes made. No
subagents used. No commit created.
