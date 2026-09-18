# Tasks: Condition Module Layering

## Phase 1: Baseline

- [x] T001 [US1] Add condition use-case behavior tests in `src/inventory/reference-data/condition/application/use-cases/condition-use-cases.spec.ts` for create default mapping, search forwarding, update not-found/mapping, and delete not-found/delegation.
- [x] T002 [US1] Add condition repository behavior tests in `src/inventory/reference-data/condition/infrastructure/persistence/prisma/prisma-condition.repository.spec.ts` for search predicates, ascending ordering, and persistence-output mapping.
- [x] T003 [US1] Add condition controller contract tests in `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts` for delegation, route metadata, permissions, validation, UUID pipes, guard, Swagger metadata, and delete status.
- [x] T004 Run `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=reference-data/condition` with the repository's ESM test environment and record the expected red result before moving production files.

## Phase 2: Domain Boundary

- [x] T005 [US2] Create `src/inventory/reference-data/condition/domain/repositories/condition.repository.ts` with plain repository input/output types and the existing `IConditionRepository` methods.
- [x] T006 [US2] Create `src/inventory/reference-data/condition/index.ts` exporting `IConditionRepository` and its repository types, then remove the obsolete `domain/interfaces/condition-repository.interface.ts`.
- [x] T007 [US2] Update `src/inventory/reference-data/condition/condition.module.ts` imports to the new repository port and run `pnpm run typecheck`.

## Phase 3: Prisma Adapter

- [x] T008 [US2] Move the adapter to `src/inventory/reference-data/condition/infrastructure/persistence/prisma/prisma-condition.repository.ts` and rename it `PrismaConditionRepository`.
- [x] T009 [US2] Map repository inputs and outputs explicitly in `src/inventory/reference-data/condition/infrastructure/persistence/prisma/prisma-condition.repository.ts` while preserving search, ordering, lookup, create, update, and delete behavior.
- [x] T010 [US2] Run `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=reference-data/condition/infrastructure/persistence/prisma` and `pnpm run typecheck` after the adapter move.

## Phase 4: Application Use Cases

- [x] T011 [US2] Move create behavior to `src/inventory/reference-data/condition/application/use-cases/create-condition/create-condition.use-case.ts` and add plain `create-condition.input.ts`.
- [x] T012 [US2] Move list behavior to `src/inventory/reference-data/condition/application/use-cases/get-conditions/get-conditions.use-case.ts` preserving `execute(search?: string)`.
- [x] T013 [US2] Move update behavior to `src/inventory/reference-data/condition/application/use-cases/update-condition/update-condition.use-case.ts` and add plain `update-condition.input.ts`.
- [x] T014 [US2] Move delete behavior to `src/inventory/reference-data/condition/application/use-cases/delete-condition/delete-condition.use-case.ts` preserving not-found behavior.
- [x] T015 [US2] Remove all request DTO imports from condition application code and run focused condition tests plus `pnpm run typecheck`.

## Phase 5: HTTP Presentation

- [x] T016 [US1] Move `condition.controller.ts` to `src/inventory/reference-data/condition/presentation/http/condition.controller.ts` preserving routes, guards, permissions, Swagger metadata, pipes, and status codes.
- [x] T017 [US1] Move request DTOs to `src/inventory/reference-data/condition/presentation/http/dto/request/` and response DTO to `src/inventory/reference-data/condition/presentation/http/dto/response/`.
- [x] T018 [US1] Update presentation imports and run controller tests plus `pnpm run typecheck`.

## Phase 6: Module Wiring and Consumers

- [x] T019 [US2] Rewire `src/inventory/reference-data/condition/condition.module.ts` to register the moved controller, application use cases, repository port, and Prisma adapter.
- [x] T020 [US2] Update `src/inventory/reference-data/use-cases/get-metadata.use-case.ts` to import `IConditionRepository` from `../condition/index.js`.
- [x] T021 [US1] Update `src/inventory/reference-data/dto/response/metadata-response.dto.ts` to import the moved condition response DTO.
- [x] T022 [US2] Search `src/inventory/reference-data/` for stale condition imports from `domain/interfaces`, `dto/`, `use-cases/`, `presentation/`, or the old persistence path, then remove only obsolete empty directories.
- [x] T023 [US1] Run focused condition tests and existing metadata/controller tests to confirm module wiring and HTTP behavior.

## Phase 7: Final Verification

- [x] T024 [US2] Verify dependency direction: domain has no Prisma/presentation imports, application has no DTO/Prisma imports, presentation has no repository imports, and only Prisma infrastructure imports Prisma.
- [x] T025 Run `pnpm run format:check` from `inventory-service`.
- [x] T026 Run `pnpm run lint` from `inventory-service`.
- [x] T027 Run `pnpm run typecheck` from `inventory-service`.
- [x] T028 Run `pnpm run lint:strict` from `inventory-service`.
- [x] T029 Run `pnpm test` from `inventory-service`.
- [x] T030 Run `pnpm run build` from `inventory-service`.
- [x] T031 Run `pnpm run validate` from `inventory-service` as final gate.
- [x] T032 Review final diff and Anti-Slop scope in `inventory-service`, recording evidence and residual risks in `specs/002-condition-layering/implementation-report.md`.

## Dependencies

```text
T001 + T002 + T003 -> T004 -> T005 -> T006 -> T007 -> T008 -> T009 -> T010
T010 -> T011 -> T012 -> T013 -> T014 -> T015
T015 -> T016 -> T017 -> T018 -> T019 -> T020 -> T021 -> T022 -> T023
T023 -> T024 -> T025 -> T026 -> T027 -> T028 -> T029 -> T030 -> T031 -> T032
```

## Parallel Opportunities

- T001, T002, and T003 target separate test seams and can be prepared in parallel before T004.
- T011, T012, T013, and T014 can be prepared in parallel after T010, but wiring stays sequential.
- T025 through T028 can run in parallel after T024; T029 through T031 remain final gates.

## MVP Scope

T001 through T023: migrated condition module with tests and working consumer wiring. T024 through T032 are mandatory before completion and before starting another module.
