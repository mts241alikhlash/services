# T049 Report

## Status

T049 complete

## Changes

- Moved all six asset request DTOs from `src/inventory/asset/dto/request/` to
  `src/inventory/asset/presentation/http/dto/request/`:
  `create-asset.dto.ts`, `update-asset.dto.ts`, `create-units.dto.ts`,
  `asset-query.dto.ts`, `asset-unit-query.dto.ts`, and `update-unit.dto.ts`.
- Moved `AssetController` and `AssetUnitController`, with their specs, to
  `src/inventory/asset/presentation/http/`.
- Updated only relative imports required by the new HTTP path in both
  controllers, both controller specs, `asset.module.ts`, and the focused
  lendable persistence spec.
- Preserved route paths and methods, `JwtAuthGuard`, permissions, UUID pipes,
  Swagger tags and operations, query/body DTO metadata, validation, raw use-case
  response forwarding, and `DELETE` HTTP 204 behavior.
- No asset response DTO or response envelope exists in the active source before
  T049; none was invented or changed. Existing use-case response values remain
  untouched.
- No module repository token or public export rewiring was made; that remains
  T050 scope.
- Added no schema, package, planning, or task changes.

## Verification

Command ran from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/asset --runInBand
Test Suites: 13 passed, 13 total
Tests:       57 passed, 57 total
```

Static source scan found no stale imports for `asset/dto` or the old asset
controller paths. `src/inventory/asset/dto/` has no remaining files.

No commit created.

## Batch Review

- Lendable persistence test now uses domain `AssetUnitQueryInput`, not presentation `AssetUnitQueryDto`; behavior assertions remain covered.
- Focused asset suite after batch fixes: 16 suites / 64 tests passed.
