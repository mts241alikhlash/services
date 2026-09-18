# T077 Report

## Status

T077 complete.

## Changes

- Removed the interactive Prisma transaction from
  `src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.ts`'s
  return operation.
- Return now awaits one local `inventoryLoan.update` directly. Asset-unit
  status, condition, and history writes remain awaited public capability calls
  in circulation application orchestration.
- Kept the create-loan transaction because it writes the circulation-owned
  `InventoryLoan` aggregate and nested `InventoryLoanItem` records together.
- Added circulation static/runtime coverage proving transaction callbacks use
  only circulation-owned delegates and return does not open a transaction for
  one owned loan write.
- Added asset static coverage proving asset persistence contains no transaction
  spanning loan, history, or approval models.

## TDD Evidence

Failing tests ran before the production change:

```text
FAIL src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.spec.ts
  does not open a transaction for a single circulation-owned return write
  Expected ObjectContaining { id: "loan-1" }
  Received: undefined
```

The failure came from the return adapter's transaction callback path. The
minimal fix replaced that transaction with the direct owned loan update.

## Boundary Check

- Circulation Prisma transaction scan finds only `tx.inventoryLoan` in the
  create-loan transaction.
- Circulation transaction callback contains no `inventoryAsset`,
  `inventoryAssetUnit`, `inventoryStatus`, `approvalWorkflow`, or
  `approvalInstance` access.
- Asset Prisma persistence contains no `$transaction` and no foreign model
  transaction access.
- Cross-module asset-unit and history sequencing remains outside local Prisma
  transactions and uses awaited public ports.
- Approval retry, idempotency, failure-state, and repair behavior was not
  redesigned. T081-T090 remain out of scope.

## Verification

Commands run from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/asset/infrastructure/persistence/prisma src/inventory/circulation/infrastructure/persistence/prisma src/inventory/approval/infrastructure/persistence/prisma --runInBand
Test Suites: 7 passed, 7 total
Tests:       34 passed, 34 total
Snapshots:   0 total
```

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/asset src/inventory/circulation src/inventory/approval --runInBand
Test Suites: 35 passed, 35 total
Tests:       157 passed, 157 total
Snapshots:   0 total
```

```text
pnpm exec prettier --check "src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.ts" "src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.spec.ts" "src/inventory/asset/infrastructure/persistence/prisma/transaction-ownership.spec.ts"
All matched files use Prettier code style!
```

No schema, package, planning, or task files changed. No subagents used. No
commit created.
