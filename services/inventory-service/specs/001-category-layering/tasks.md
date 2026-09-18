# Tasks: Category Module Layering

## Phase 1: Baseline

- [X] T001 Create focused category use-case behavior tests in `src/inventory/reference-data/category/application/use-cases/` covering create mapping, search forwarding, update not-found, update mapping, delete not-found, and delete delegation.
- [X] T002 Create category repository behavior tests beside `src/inventory/reference-data/category/infrastructure/persistence/prisma/` covering case-insensitive code/name search and ascending name ordering.
- [X] T003 Run `pnpm exec jest --testPathPatterns=reference-data/category` from `inventory-service` and record the baseline result before moving files. Exact command failed because direct Jest lacks `NODE_OPTIONS=--experimental-vm-modules`; corrected ESM command passed.

## Phase 2: Repository Port

- [X] T004 Move `src/inventory/reference-data/category/domain/interfaces/category-repository.interface.ts` to `src/inventory/reference-data/category/domain/repositories/category.repository.ts` and preserve `ICategoryRepository` method behavior.
- [X] T005 Replace Prisma-shaped repository parameters in `src/inventory/reference-data/category/domain/repositories/category.repository.ts` with plain `CategoryCreateRepositoryInput`, `CategoryUpdateRepositoryInput`, and output types.
- [X] T006 Update imports in `src/inventory/reference-data/category/category.module.ts` and the category repository adapter, then run `pnpm run typecheck`.

## Phase 3: Prisma Adapter

- [X] T007 Move `src/inventory/reference-data/category/infrastructure/persistence/prisma-category.repository.ts` to `src/inventory/reference-data/category/infrastructure/persistence/prisma/prisma-category.repository.ts`.
- [X] T008 Map repository inputs explicitly to Prisma data in `src/inventory/reference-data/category/infrastructure/persistence/prisma/prisma-category.repository.ts` while preserving search, ordering, lookup, create, update, and delete behavior.
- [X] T009 Run category repository tests and `pnpm run typecheck` after the adapter move.

## Phase 4: Application Use Cases

- [X] T010 Move `create-category.use-case.ts` to `src/inventory/reference-data/category/application/use-cases/create-category/create-category.use-case.ts` and add `create-category.input.ts` without decorators.
- [X] T011 Move `get-categories.use-case.ts` to `src/inventory/reference-data/category/application/use-cases/get-categories/get-categories.use-case.ts` and preserve `execute(search?: string)` behavior.
- [X] T012 Move `update-category.use-case.ts` to `src/inventory/reference-data/category/application/use-cases/update-category/update-category.use-case.ts` and add `update-category.input.ts` without decorators.
- [X] T013 Move `delete-category.use-case.ts` to `src/inventory/reference-data/category/application/use-cases/delete-category/delete-category.use-case.ts` and preserve not-found behavior.
- [X] T014 Remove all request DTO imports from category application code and run `pnpm exec jest --testPathPatterns=reference-data/category`. Exact command failed because direct Jest lacks `NODE_OPTIONS=--experimental-vm-modules`; corrected ESM command passed.

## Phase 5: HTTP Presentation

- [X] T015 Move `src/inventory/reference-data/category/presentation/category.controller.ts` to `src/inventory/reference-data/category/presentation/http/category.controller.ts` and preserve routes, guards, permissions, Swagger metadata, and status codes.
- [X] T016 Move category request DTOs from `src/inventory/reference-data/category/dto/request/` to `src/inventory/reference-data/category/presentation/http/dto/request/`.
- [X] T017 Move `src/inventory/reference-data/category/dto/response/category-response.dto.ts` to `src/inventory/reference-data/category/presentation/http/dto/response/category-response.dto.ts`.
- [X] T018 Update presentation imports and run `pnpm run typecheck`.

## Phase 6: Module Wiring

- [X] T019 Update `src/inventory/reference-data/category/category.module.ts` to register the moved controller, four application use cases, repository port, and Prisma adapter.
- [X] T020 Search `src/inventory/reference-data/category/` for stale imports from `domain/interfaces`, `dto/`, `use-cases/`, `presentation/`, or the old persistence path, then remove only obsolete empty directories.
- [X] T021 Run focused category tests and confirm the category module boots through its existing Nest test coverage.

## Phase 7: Final Verification

- [X] T022 Verify dependency direction in `src/inventory/reference-data/category/`: domain has no Prisma/presentation imports, application has no DTO/Prisma imports, presentation has no repository imports, and only infrastructure imports Prisma.
- [X] T023 Run `pnpm run format:check` from `inventory-service`.
- [X] T024 Run `pnpm run lint` from `inventory-service`.
- [X] T025 Run `pnpm run typecheck` from `inventory-service`.
- [X] T026 Run `pnpm run lint:strict` from `inventory-service`.
- [X] T027 Run `pnpm test` from `inventory-service`.
- [X] T028 Run `pnpm run build` from `inventory-service`.
- [X] T029 Run `pnpm run validate` from `inventory-service` as final gate.
- [ ] T030 Review `git diff --stat` and confirm changes are limited to the category migration, tests, and explicitly required documentation. Git metadata now exists in the target monorepo, but its history starts at the full snapshot and has no pre-migration parent commit, so the historical scope cannot yet be proven.

## Dependencies

```text
T001 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008 -> T009
T009 -> T010 -> T011 -> T012 -> T013 -> T014
T014 -> T015 -> T016 -> T017 -> T018 -> T019 -> T020 -> T021
T021 -> T022 -> T023 -> T024 -> T025 -> T026 -> T027 -> T028 -> T029 -> T030
```

## Parallel Opportunities

- T001 and T002 can run in parallel after confirming current behavior, because they target separate test files and different seams.
- T010, T011, T012, and T013 can be prepared in parallel after the repository port is stable, but move/wire integration must remain sequential.
- T023, T024, T025, and T026 can run in parallel after T022; T027, T028, and T029 should run after those checks complete.

## MVP Scope

T001 through T021: migrated category module with focused tests and working Nest wiring. Do not start another inventory module until T022 through T030 pass.
