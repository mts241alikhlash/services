# T074 Report

## Status

T074 complete.

## Changes

- Replaced the shared helper's `Prisma.TransactionClient` parameter with a
  narrow `UnitMovementOperations` capability contract.
- Preserved movement behavior:
  - one awaited status update for all unit IDs;
  - optional awaited condition update per unit;
  - one awaited history record per unit;
  - per-unit previous status and note handling;
  - no operations for an empty unit list.
- Rewired approval movement calls to use asset-owned
  `IAssetUnitMutationPort` and circulation-owned `IHistoryCapabilityPort`.
- Wired `ApprovalModule` to consume those public owning-module ports. The
  existing circulation-to-approval module edge remains safe through
  `forwardRef`.
- Preserved the shared helper self-check and strengthened it to inspect source
  text, so forbidden Prisma and concrete module imports cannot be hidden by
  checking only `moveUnitsAndRecord.toString()`.
- Added a capability delegation test covering status, condition, history, and
  exact payload preservation.

## Boundary Check

`src/inventory/shared/infrastructure/inventory-unit-movement.steps.ts` contains
no imports or references to:

- `@prisma/client`
- `PrismaService`
- `Prisma.TransactionClient`
- `inventory/asset`
- `inventory/circulation`

The shared layer now sequences public capability calls only. Prisma writes stay
inside owning adapters.

## TDD Evidence

Failing tests ran before production changes:

```text
9 tests failed because the helper still dereferenced Prisma through
inventoryAssetUnit/inventoryHistory, and the source self-check detected
@prisma/client in the shared helper.
```

The added approval module boundary test also failed before module wiring:

```text
Nest could not find IAssetUnitMutationPort element
```

## Verification

Focused command:

```bash
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns "inventory/(shared|asset|circulation|approval)" --runInBand
```

Result:

```text
Test Suites: 36 passed, 36 total
Tests:       167 passed, 167 total
```

Prettier ran on seven changed TypeScript files.

Typecheck, lint, build, full Jest, schema, package, planning, and task checks
were not run because T074 requested focused shared/asset/circulation/approval
Jest tests only.

Approval retry/idempotency behavior was not redesigned. T081-T090 remains out
of scope.

No schema, package, planning, or task files changed. No subagents used. No
commit created.
