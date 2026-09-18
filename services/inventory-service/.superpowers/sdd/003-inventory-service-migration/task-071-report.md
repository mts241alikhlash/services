# T071 Report

## Status

T071 complete.

## Changes

- Added `UpdateAssetUnitStatusesRepositoryInput` with exact current batch
  mutation fields: `unitIds` and `statusId`.
- Added `UpdateAssetUnitConditionRepositoryInput` with exact current per-unit
  mutation fields: `unitId` and `conditionId`.
- Added narrow `IAssetUnitMutationPort.updateStatuses(...)` and
  `IAssetUnitMutationPort.updateCondition(...)`, both returning `Promise<void>`.
  Current circulation and approval movement callers do not consume Prisma
  mutation results, so no count or entity projection leaks into the port.
- Exported the mutation port and its input types from `asset/index.ts` for later
  module composition.
- Kept history fields, transaction type IDs, previous status IDs, Prisma types,
  DTOs, HTTP concerns, and transaction handles out of the asset-owned contract.

## Unchanged

- No caller rewiring or cross-module write removal. T073 and T074 own that work.
- No Prisma adapter implementation change. The existing CRUD repository
  contract remains unchanged; T073/T074 own adapter wiring and implementation.
- No contract test added. This slice adds declarations only; typecheck is the
  relevant contract check and no runtime behavior changed.
- No schema, package, planning, or tasks changes.

## Verification

Focused asset, circulation, and approval Jest tests were run after the port
change. Typecheck was not run because the requested verification scope was
Jest-only.

No subagents used. No commit created.
