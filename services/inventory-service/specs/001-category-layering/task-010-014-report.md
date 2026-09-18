# T010-T014 Report

T010-T013 are complete. T014 remains unchecked because the exact requested Jest command failed under this repository's ESM setup; the corrected command passed.

## Files

- Added `src/inventory/reference-data/category/application/use-cases/create-category/create-category.input.ts`.
- Added `src/inventory/reference-data/category/application/use-cases/create-category/create-category.use-case.ts`.
- Added `src/inventory/reference-data/category/application/use-cases/get-categories/get-categories.use-case.ts`.
- Added `src/inventory/reference-data/category/application/use-cases/update-category/update-category.input.ts`.
- Added `src/inventory/reference-data/category/application/use-cases/update-category/update-category.use-case.ts`.
- Added `src/inventory/reference-data/category/application/use-cases/delete-category/delete-category.use-case.ts`.
- Moved focused spec to `src/inventory/reference-data/category/application/use-cases/category-use-cases.spec.ts`.
- Updated category module and controller use-case imports.
- Removed old files under `src/inventory/reference-data/category/use-cases/`.
- T010-T013 are complete in `specs/001-category-layering/tasks.md`.
- T014 remains unchecked in `specs/001-category-layering/tasks.md` because the exact requested Jest command failed.

## Commands and Results

- `pnpm exec jest --testPathPatterns=reference-data/category`: failed before running tests because direct Jest invocation lacked `NODE_OPTIONS=--experimental-vm-modules`; both suites reported `Must use import to load ES Module`.
- `pnpm test -- --testPathPatterns=reference-data/category`: exited 0 but ran no tests because the package script passed `--` as a Jest pattern.
- `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=reference-data/category`: passed, 2 suites and 8 tests.
- `pnpm run typecheck`: passed, `tsc --noEmit` exited 0.
- Application import search for request DTOs, Prisma, old use-case paths: no matches.

## Concerns

- T014 verification limitation: the exact requested Jest command does not work with this repository's ESM setup unless `NODE_OPTIONS=--experimental-vm-modules` is supplied. The corrected command passed.
- No HTTP controller/DTO relocation or broader module wiring change was made.
