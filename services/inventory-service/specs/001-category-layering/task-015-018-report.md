# T015-T018 Report

## Files

- Moved `src/inventory/reference-data/category/presentation/category.controller.ts` to `src/inventory/reference-data/category/presentation/http/category.controller.ts`.
- Moved request DTOs to `src/inventory/reference-data/category/presentation/http/dto/request/`.
- Moved `category-response.dto.ts` to `src/inventory/reference-data/category/presentation/http/dto/response/`.
- Updated relative imports in the moved controller, category module, and shared metadata response DTO.
- Preserved controller routes, guards, permissions, Swagger metadata, status codes, DTO decorators, response shape, and method behavior.
- Did not change provider wiring beyond required controller import update. T019 wiring was verified in the subsequent report.

## Verification

- `pnpm exec jest --testPathPatterns=reference-data/category`: failed before test execution because direct Jest invocation lacks `NODE_OPTIONS=--experimental-vm-modules`; both suites reported `Must use import to load ES Module`.
- `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=reference-data/category`: passed, 2 suites and 8 tests.
- `pnpm run typecheck`: passed, `tsc --noEmit` exited 0.
- `pnpm exec prettier --check "src/inventory/reference-data/category/**/*.ts"`: passed, all matched files use Prettier code style.
- Category stale-path scan: no old controller or DTO paths remain.

## Scope

- No Git commit created.
- T019-T029 are covered by subsequent reports and final verification. T030 remains unchecked because no Git metadata exists in this workspace.
