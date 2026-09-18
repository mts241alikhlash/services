# Review: T023

Review verdict: PASS.
Quality status: PASS after verified review fixes.

Review findings and disposition:

- Fixed and covered: latest asset/unit queries now exclude soft-deleted records.
- Fixed and covered: optional `assetNumber` is preserved by create-asset mapping.
- Covered: conflicts are raised from the actual create call.
- Covered: add-units no-latest/default quantity and create/reload failures.
- Covered: create-asset and add-units operation ordering.
- Covered: explicit `lendable: false` and repository search predicate behavior.
- Covered: omitted/null create fields and non-positive quantity fallback.

Evidence before fix:

- Asset use-case tests: 9 suites, 28 tests passed.
- Lendable repository tests: 1 suite, 6 tests passed.
- Prettier, ESLint, strict ESLint, and typecheck passed.

The review identified two load-bearing source defects: latest asset/unit queries omitted `deletedAt: null`, and create-asset input contained optional `assetNumber` while current use-case mapping ignored it. Both were fixed with the minimum production changes listed below.

## Justified Production Fixes

1. `src/inventory/asset/use-cases/create-asset.use-case.ts`: honor supplied `dto.assetNumber`; retain generated numbering as fallback.
2. `src/inventory/asset/infrastructure/persistence/prisma-asset.repository.ts`: add `deletedAt: null` to latest asset and latest-by-prefix queries to preserve FR-014 soft-delete behavior.
3. `src/inventory/asset/infrastructure/persistence/prisma-asset-unit.repository.ts`: add `deletedAt: null` to latest-unit query to preserve FR-014 soft-delete behavior.

## Post-Fix Evidence

- Focused asset suite: 13 suites passed, 57 tests passed, 0 snapshots.
- Asset Prettier check passed.
- Asset ESLint passed.
- Asset strict ESLint passed.
- Typecheck passed.
- Full repository format check remains blocked by unrelated pre-existing `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`.
