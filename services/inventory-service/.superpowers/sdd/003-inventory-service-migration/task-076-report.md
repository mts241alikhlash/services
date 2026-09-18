# T076 Report

## Status

T076 complete.

## Changes

- Removed approval adapter access to `inventoryLoan`, `inventoryLoanItem`,
  `inventoryAssetUnit`, `inventoryHistory`, `inventoryStatus`, and
  `inventoryTransactionType`.
- Removed approval adapter dependencies on `IAssetUnitMutationPort`,
  `IHistoryCapabilityPort`, and `moveUnitsAndRecord`.
- Removed approval loan-detail Prisma include and mapping. Pending approval
  details now come from circulation's `ILoanCapabilityPort`.
- Kept `PrismaApprovalRepository` limited to approval-owned workflow, instance,
  and log Prisma models.
- Kept approval local `$transaction` for approval log and instance writes only.
  It preserves reject, intermediate approval, and final approval result shapes.
- Moved approval consequence sequencing into application use cases through
  public ports:
  - status lookup through `IStatusLookupPort`;
  - loan detail, loan status, and loan-item lookup through circulation ports;
  - unit status movement through `IAssetUnitMutationPort`;
  - history through `IHistoryCapabilityPort`;
  - transaction type lookup through `ITransactionTypeCapabilityPort`.
- Added circulation adapter implementations and module exports for the public
  loan and loan-item capability ports required by approval.
- Preserved pending role matching, loan detail output mapping, approval action
  result mapping, current error messages, and empty-loan movement behavior.
- Updated approval tests for public-port orchestration and added a source-level
  owner-only Prisma access test.

## TDD Evidence

Failing tests ran before production changes:

```text
Approval adapter owner-only test failed because foreign model names and
cross-module movement dependencies were still present.
Pending approval test failed because approval still resolved pending status
through Prisma.
Approval process orchestration test failed because the use case had no public
status, circulation, asset, or history ports.
```

## Boundary Check

`src/inventory/approval/infrastructure/persistence/prisma/prisma-approval.repository.ts`
contains no references to foreign inventory models, `moveUnitsAndRecord`, or
asset/circulation movement capability ports.

`processApprovalTransaction` now accepts only
`ProcessApprovalLocalTransactionInput`; no reference ID, loan item data,
transaction type, or foreign Prisma client crosses the approval repository
boundary.

T087 database-side pending-role filtering remains unchanged. T081-T090 retry,
idempotency, failure-state, and repair redesign remains out of scope.

## Verification

Command run from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns "inventory/(approval|circulation|asset)" --runInBand
```

Result:

```text
Test Suites: 34 passed, 34 total
Tests:       153 passed, 153 total
Snapshots:   0 total
```

No schema, package, planning, or task files changed. No subagents used. No
commit created.
