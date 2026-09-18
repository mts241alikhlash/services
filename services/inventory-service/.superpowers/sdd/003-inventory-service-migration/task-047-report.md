# T047 Report

## Status

T047 complete

## Changes

- Moved `PrismaAssetRepository` to `src/inventory/asset/infrastructure/persistence/prisma/prisma-asset.repository.ts`.
- Moved `PrismaAssetUnitRepository` to `src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.repository.ts`.
- Adapted both adapters to extend the T046 domain repository ports in `domain/repositories/`.
- Kept `ASSET_WITH_DETAILS_INCLUDE`, unit includes, pagination, asset filters, lendability filtering, ordering, category lookup, prefix sequence lookup, and latest-record queries.
- Added explicit Prisma-to-domain output mapping for assets, units, references, pagination results, record outputs, and category/latest projections.
- Preserved unit create, batch create, update, hard remove, soft delete, asset soft-delete, unit lifecycle, and all `deletedAt: null` filters.
- Removed obsolete `findLatestAsset()` after confirming no production consumer exists; preserved `findLatestAssetByPrefix()`.
- Preserved staged old token wiring by changing only `asset.module.ts` adapter imports; use cases, DTOs, controllers, module providers, and public exports remain otherwise untouched.
- Updated existing focused persistence test imports for new adapter paths.
- Added no tests: existing tests cover latest-record soft-delete behavior and lendability behavior.
- Added no schema, package, planning, or task changes.

## Verification

Command ran from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/asset --runInBand
Test Suites: 13 passed, 13 total
Tests:       57 passed, 57 total
```

No commit created.

## Batch Review

- Added `deletedAt: null` to both nested asset keyword predicates.
- Focused asset suite after fixes: 16 suites / 64 tests passed.
