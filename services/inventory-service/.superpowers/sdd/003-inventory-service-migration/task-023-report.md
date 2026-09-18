# T023 Report: Asset Use-Case Characterization

## Scope

Added behavior characterization specs for all nine current asset operations under:

`inventory-service/src/inventory/asset/use-cases/`

DTOs, modules, package configuration, schema, and planning docs were not changed. Review fixes changed three production files, listed in the review reconciliation below.

## Added Specs

- `create-asset.use-case.spec.ts`
- `add-units.use-case.spec.ts`
- `get-assets.use-case.spec.ts`
- `get-asset-by-id.use-case.spec.ts`
- `get-asset-units.use-case.spec.ts`
- `update-asset.use-case.spec.ts`
- `update-unit.use-case.spec.ts`
- `delete-asset.use-case.spec.ts`
- `delete-unit.use-case.spec.ts`

## Characterized Behavior

### Create asset

- Looks up category before sequence generation.
- Uppercases category code for the `AST-{CATEGORY}/{YEAR}/` prefix.
- Reads latest asset number for matching prefix and increments its numeric suffix.
- Starts at `001` when no latest record exists.
- Uses quantity greater than zero, otherwise defaults to one unit.
- Creates one unit row per quantity with padded unit suffixes.
- Uses the caller barcode only for a single-unit create; multi-unit creates use generated unit numbers as barcodes.
- Maps purchase price to each unit's current book value.
- Maps condition, status, and location references into each unit seed.
- Converts purchase date string to `Date`.
- Preserves nullable and optional asset fields in repository input.
- Returns the repository create result unchanged.
- Propagates category lookup errors and repository conflicts unchanged. Current source does not translate conflicts.

### Add units

- Reads the parent asset first.
- Throws `NotFoundException("Asset with ID {id} not found")` when parent is absent.
- Does not read latest unit or create rows after a missing parent.
- Reads latest unit number and continues its numeric suffix.
- Starts unit numbering at `01` when no latest unit exists.
- Creates generated unit numbers and matching barcodes.
- Copies parent purchase price into each new unit's current book value.
- Maps request condition, status, and location references.
- Calls `createMany`, then reloads all non-deleted asset units through `findByAsset`.
- Returns the refreshed unit result unchanged.

### Get assets

- Explicitly forwards page, limit, keyword, category, location, status, condition, and funding-source filters.
- Preserves explicit `undefined` properties for empty queries.
- Returns repository pagination unchanged.
- Propagates repository read errors unchanged.

### Get asset by ID

- Delegates the requested ID to `findById`.
- Returns the repository result unchanged when found.
- Throws `NotFoundException("Asset with ID {id} not found")` when no record is returned.
- Propagates repository read errors unchanged.

### Get asset units

- Explicitly forwards page, limit, lendable, and search fields.
- Preserves lendability and search query forwarding for repository-side filtering.
- Preserves explicit `undefined` properties for empty queries.
- Returns repository pagination unchanged.
- Propagates repository read errors unchanged.

### Update asset

- Checks asset existence before update.
- Throws `NotFoundException("Asset with ID {id} not found")` when absent.
- Converts an optional purchase-date string to `Date`.
- Maps all current update fields to repository input.
- Converts omitted or nullish optional DTO values to `undefined`, matching current source behavior.
- Delegates the same ID and mapped input to `update`.
- Returns the repository update result unchanged.
- Propagates repository conflict errors unchanged. Current source has no conflict translation.

### Update unit

- Checks unit existence before update.
- Throws `NotFoundException("Asset unit with ID {id} not found")` when absent.
- Maps barcode, notes, custodian, condition, status, and location fields.
- Converts omitted or nullish optional DTO values to `undefined`, matching current source behavior.
- Delegates the same ID and mapped input to `update`.
- Returns the repository update result unchanged.
- Propagates repository conflict errors unchanged. Current source has no conflict translation.

### Delete asset

- Checks asset existence before mutation.
- Throws `NotFoundException("Asset with ID {id} not found")` when absent.
- Calls `softDelete`, not hard-delete or `remove`.
- Returns `undefined` after successful soft-delete.
- Propagates soft-delete errors unchanged.

### Delete unit

- Checks unit existence before mutation.
- Throws `NotFoundException("Asset unit with ID {id} not found")` when absent.
- Calls `softDelete`, not hard-delete or `remove`.
- Returns `undefined` after successful soft-delete.
- Propagates soft-delete errors unchanged.

## TDD Evidence

Tests were written before production changes. The initial focused run established that the characterization specs execute against current implementations. Type-only fixture corrections were confined to specs and represent runtime-null inputs accepted by current use-case mapping.

## Verification

Focused command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/asset/use-cases --runInBand
```

Result:

- 9 test suites passed.
- 28 tests passed.
- 0 snapshots.

Changed-spec formatting command:

```text
pnpm exec prettier --check "src/inventory/asset/use-cases/*.spec.ts"
```

Result: passed after formatting.

Static checks:

- `pnpm run lint`: passed.
- `pnpm run lint:strict`: passed.
- `pnpm run typecheck`: passed.

Repo-wide format check:

- `pnpm run format:check`: failed on pre-existing unrelated file `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`.
- No unrelated file was modified to clear this failure.

## Constraints Honored

- T023 only.
- No subagents.
- No commit.
- No unrelated production changes.
- No file moves.
- No DTO, module, package, schema, or planning-doc changes. `tasks.md` was changed only during final bookkeeping reconciliation to mark T023 complete.

## Review Fixes

Review source: `inventory-service/.superpowers/sdd/003-inventory-service-migration/task-023-review.md`.

### TDD Red Evidence

Added regression tests before production edits for:

- `findLatestAsset()` excluding soft-deleted assets.
- `findLatestAssetByPrefix()` excluding soft-deleted assets.
- `findLatestUnit()` excluding soft-deleted units.
- Create honoring optional `assetNumber` for the asset and generated units.

Focused command before production fixes:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns="src/inventory/asset/(use-cases|infrastructure/persistence/prisma-asset-latest|infrastructure/persistence/prisma-asset-unit\\.lendable)" --runInBand
```

Result: **2 failed suites, 9 passed suites; 4 failed tests, 41 passed tests**.
Failures were the three missing `deletedAt: null` predicates and ignored custom
`assetNumber`. The remaining added characterization tests passed against the
pre-fix implementation.

### TDD Green Evidence

Minimum production fixes:

- `src/inventory/asset/use-cases/create-asset.use-case.ts`: use `dto.assetNumber`
  when supplied; generated numbering remains the fallback.
- `src/inventory/asset/infrastructure/persistence/prisma-asset.repository.ts`:
  add `deletedAt: null` to `findLatestAsset` and `findLatestAssetByPrefix`.
- `src/inventory/asset/infrastructure/persistence/prisma-asset-unit.repository.ts`:
  add `deletedAt: null` to `findLatestUnit`.

Added behavior characterization for actual create conflicts, add-units no-latest
and default quantity, createMany and reload failures, operation ordering,
nullable/omitted create fields, non-positive quantity fallback, explicit
`lendable: false`, and repository search predicates.

Focused command after production fixes:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/asset --runInBand
```

Result: **13 test suites passed, 57 tests passed, 0 snapshots**.

### Changed Files

- `src/inventory/asset/infrastructure/persistence/prisma-asset-latest.spec.ts`
- `src/inventory/asset/infrastructure/persistence/prisma-asset.repository.ts`
- `src/inventory/asset/infrastructure/persistence/prisma-asset-unit.lendable.spec.ts`
- `src/inventory/asset/infrastructure/persistence/prisma-asset-unit.repository.ts`
- `src/inventory/asset/use-cases/add-units.use-case.spec.ts`
- `src/inventory/asset/use-cases/create-asset.use-case.spec.ts`
- `src/inventory/asset/use-cases/create-asset.use-case.ts`
- `src/inventory/asset/use-cases/get-asset-units.use-case.spec.ts`
- `task-023-report.md`

No schema, package, planning-doc, or unrelated-module files changed during review fixes. `tasks.md` was changed only during final bookkeeping reconciliation to mark T023 complete.

### Final Checks

- `pnpm exec prettier --check "src/inventory/asset/**/*.ts"`: passed.
- `pnpm exec eslint "src/inventory/asset/**/*.ts" --max-warnings=0`: passed.
- `pnpm exec eslint -c eslint.typecheck.config.mjs "src/inventory/asset/**/*.ts" --max-warnings=0`: passed.
- `pnpm run typecheck`: passed with `$ tsc --noEmit`.

### Residual Concerns

- Latest-number selection remains non-atomic with asset creation; concurrent
  creates can still race on the unique asset number. Concurrency repair belongs
  to a separate behavior or persistence task, not T023 characterization.
- Optional custom asset numbers are now forwarded, but uniqueness/conflict
  behavior remains repository/database behavior and is only characterized as
  error propagation at the use-case boundary.
- Repository tests use Prisma spies and do not execute against a live database.

## Final Reconciliation Evidence

Reconciliation completed against `task-023-review.md`, this report, `progress.md`, and `specs/003-inventory-service-migration/tasks.md`.

- T023 review status is now `PASS` with quality status `PASS after verified review fixes`.
- T023 is the only task checkbox changed to complete in `tasks.md`.
- Three justified production fixes are recorded: optional `assetNumber` mapping in `src/inventory/asset/use-cases/create-asset.use-case.ts`; `deletedAt: null` in latest asset queries in `src/inventory/asset/infrastructure/persistence/prisma-asset.repository.ts`; and `deletedAt: null` in latest unit query in `src/inventory/asset/infrastructure/persistence/prisma-asset-unit.repository.ts`.
- The changed production files and review test files are listed in the review record and above evidence.
- The contradictory claim that production source was unchanged was removed.
- Residual risk retained: repo-wide `pnpm run format:check` remains blocked by unrelated pre-existing `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`.
- No asset production logic or tests were changed during this bookkeeping reconciliation.
