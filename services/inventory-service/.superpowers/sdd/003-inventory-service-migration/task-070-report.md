# T070 Report

This report records the T070 scoped snapshot. Later ownership work superseded
its foreign-reference residual list; final evidence is in
`specs/003-inventory-service-migration/data-model.md`.

## Status

T070 scoped follow-up complete and reviewed.

## Changes

- Replaced `UNIT_INCLUDE` and `UNIT_LIST_INCLUDE` reference and asset relation
  includes in `prisma-asset-unit.repository.ts` with owned
  `inventoryAssetUnit` queries only.
- Injected the public asset repository capability
  `IAssetRepository.findReferenceById` and the T068 condition, status, and
  location lookup ports.
- Added `AssetReferenceOutput` and `findReferenceById` to the asset public
  repository contract. The adapter selects only asset identity, number, name,
  and category ID, then resolves category through its existing public lookup
  port. This avoids recursive full asset hydration through unit reads.
- Hydrated unit asset, category, condition, status, and location projections
  through owning-module capabilities while keeping the existing output shape.
- Changed `findByIds` to query only owned `InventoryAssetUnit` scalar rows and
  hydrate through a capability-specific private hydrator, so only public asset
  and status capabilities are called for asset name and `status.allowTransactions`.
- Preserved `hydrateUnit` for normal list/detail and mutation paths, including
  condition and location projections.
- Preserved `status.allowTransactions` for `lendable` filtering without
  exposing the internal filtering field in repository output.
- Preserved unit and asset-name search, asset-name/unit-number ordering,
  pagination, total count, and `deletedAt: null` filtering. Capability
  filtering occurs before pagination so lendable totals and pages remain
  correct.
- Kept unit mutation methods unchanged in purpose and scope. They still write
  only `InventoryAssetUnit`; T071 mutation-capability redesign was not done.
- Updated focused repository and lendability tests for capability hydration,
  owned-only Prisma queries, lendability, search, pagination, and soft-delete
  behavior. Updated the latest-unit fixture for the required injected ports.
- Existing `AssetModule` wiring resolves `IAssetRepository` and all reference
  lookup ports through public owning-module tokens. No concrete foreign adapter
  import was added.

## Unchanged

- No schema or package changes performed. T070 task state now records this
  scoped completion.
- No T071+ mutation, circulation, approval, shared helper, or orchestration
  redesign performed.
- No HTTP contract or use-case changes performed.
- No concrete foreign Prisma adapter is imported by the unit adapter.

## Residual at T070 snapshot

The asset-unit repository still uses Prisma relation `connect` operations for
condition, status, and location during writes. Its `findAll` path also keeps
asset-name relation search/order and status relation filtering for lendability.
These are deferred ownership residue, not solved by the `findByIds` capability
boundary. Circulation and approval relation projections remain outside this task.

## Verification

Command run from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/asset inventory/circulation inventory/approval --runInBand
Test Suites: 35 passed, 35 total
Tests:       160 passed, 160 total
Snapshots:   0 total
Ran all test suites matching inventory/asset|inventory/circulation|inventory/approval.
```

No subagents used. No commit created. No lint, format, typecheck, build,
schema, package, or planning changes performed.

## Review Outcome at T070 snapshot

- `findByIds` calls only `findReferenceById` and `statusLookup`.
- Focused test proves condition and location lookup ports are not called.
- Exact capability output remains unchanged.
- T070 is marked complete for this scoped follow-up; deferred relation
  predicates, ordering, and relation writes remain ownership residue.
