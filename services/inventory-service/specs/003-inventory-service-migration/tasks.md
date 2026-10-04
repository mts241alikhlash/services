# Tasks: Inventory Service Clean Architecture Migration

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`
**Scope**: Service-wide internal migration. Preserve public behavior. Enforce module table ownership.

## Execution Rules

- Run tasks in ID order unless dependency graph explicitly allows parallel work.
- Keep each implementation slice limited to one module or one named boundary concern.
- Use ESM-safe Jest command: `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=<path> --runInBand`.
- Do not change database schema, add dependencies, add endpoints, or add events unless a task explicitly creates and approves a separate contract first.
- Use TDD for new characterization and seam tests: write test, run focused test, make smallest change, rerun focused test.
- Run `pnpm run validate` at every wave boundary and before claiming final completion.

## Phase 1: Setup

**Goal**: Establish measurable baseline and source-of-truth migration records.

- [x] T001 Record current route, method, permission, DTO, response, status-code, and guard inventory in `inventory-service/specs/003-inventory-service-migration/contracts/public-http.md`.
- [x] T002 Record current Prisma model access by module and confirm the 15-model ownership matrix in `inventory-service/specs/003-inventory-service-migration/data-model.md`.
- [x] T003 Record current use-case, controller, repository, DTO, and spec paths in `inventory-service/specs/003-inventory-service-migration/research.md`.
- [x] T004 Run `pnpm run validate` from `inventory-service` and record suite count, test count, warnings, and exit status in `inventory-service/specs/003-inventory-service-migration/quickstart.md`.
- [x] T005 Record current approval and circulation transaction behavior cases in `inventory-service/specs/003-inventory-service-migration/research.md`.
- [x] T006 Confirm `pnpm prisma:generate` is current and record generated-client prerequisite in `inventory-service/specs/003-inventory-service-migration/quickstart.md`.

## Phase 2: Foundational

**Goal**: Define rules and reusable verification before module work starts.

- [x] T007 Define the migration wave gate, focused-test command, static checks, and final validation command in `inventory-service/specs/003-inventory-service-migration/quickstart.md`.
- [x] T008 Document module public-port rules, narrow projections, ESM import exceptions, and cross-module transaction rules in `inventory-service/specs/003-inventory-service-migration/contracts/module-boundaries.md`.
- [x] T009 Add a repository ownership review checklist covering every `this.prisma.<model>` access in `inventory-service/specs/003-inventory-service-migration/checklists/requirements.md`.
- [x] T010 Add an old-layout and forbidden-import review checklist for domain, application, presentation, and infrastructure in `inventory-service/specs/003-inventory-service-migration/checklists/requirements.md`.
- [x] T011 Confirm `inventory-service/src/inventory/inventory.module.ts` remains the composition root and document its expected module imports in `inventory-service/specs/003-inventory-service-migration/contracts/module-boundaries.md`.
- [x] T012 Confirm `inventory-service/src/inventory/shared/` contains only domain-neutral helpers and list any business-owned helper that must move in `inventory-service/specs/003-inventory-service-migration/data-model.md`.

## Phase 3: User Story 1 - Preserve Inventory API Behavior

**Story Goal**: Freeze and prove existing HTTP behavior before structural and ownership changes.

**Independent Test**: Existing route paths, methods, permissions, validation, response envelope, success/error statuses, filtering, pagination, not-found behavior, and fail-closed identity behavior remain equivalent in focused tests and HTTP smoke scenarios.

- [x] T013 [P] [US1] Add reference-data controller contract tests for funding-source routes in `inventory-service/src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts` covering delegation, permissions, validation, UUID handling, response envelope, and status codes.
- [x] T014 [P] [US1] Add reference-data controller contract tests for location routes in `inventory-service/src/inventory/reference-data/location/presentation/location.controller.spec.ts` covering delegation, permissions, validation, UUID handling, response envelope, and status codes.
- [x] T015 [P] [US1] Add reference-data controller contract tests for status routes in `inventory-service/src/inventory/reference-data/status/presentation/status.controller.spec.ts` covering delegation, permissions, validation, UUID handling, response envelope, and status codes.
- [x] T016 [P] [US1] Add asset controller characterization tests in `inventory-service/src/inventory/asset/presentation/asset.controller.spec.ts` covering list, detail, create, update, delete, delegation, permissions, validation, and response statuses.
- [x] T017 [P] [US1] Add asset-unit controller characterization tests in `inventory-service/src/inventory/asset/presentation/asset-unit.controller.spec.ts` covering list, detail, add, update, delete, lendable query behavior, permissions, validation, and response statuses.
- [x] T018 [P] [US1] Add circulation controller characterization tests in `inventory-service/src/inventory/circulation/presentation/loan.controller.spec.ts` covering loan list, detail, create, return, period/query forwarding, permissions, validation, and response statuses.
- [x] T019 [P] [US1] Add history controller characterization tests in `inventory-service/src/inventory/circulation/presentation/history.controller.spec.ts` covering history query forwarding, permission checks, validation, pagination, and response statuses.
- [x] T020 [P] [US1] Extend approval controller characterization tests in `inventory-service/src/inventory/approval/presentation/approval.controller.spec.ts` for pending approvals and approval actions, including permission denial and validation failures.
- [x] T021 [P] [US1] Add workflow controller characterization tests in `inventory-service/src/inventory/approval/presentation/workflow.controller.spec.ts` covering list, detail, create, permission checks, validation, and response statuses.
- [x] T022 [US1] Add use-case characterization tests for all five circulation operations in `inventory-service/src/inventory/circulation/use-cases/`, preserving current input mapping, not-found, status, and transaction behavior before file moves.
- [x] T023 [US1] Add missing asset use-case behavior tests in `inventory-service/src/inventory/asset/use-cases/` for all nine operations, including soft-delete, latest-record, unit lifecycle, lendability, and reference lookup behavior.
- [x] T024 [US1] Add missing approval use-case behavior tests in `inventory-service/src/inventory/approval/use-cases/` for workflow lookup, pending lookup, role matching, loan detail lookup, and downstream failure outcomes.
- [x] T025 [US1] Run focused controller and use-case suites with `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory --runInBand` from `inventory-service` and record characterization results in `inventory-service/specs/003-inventory-service-migration/quickstart.md`.
- [x] T026 [US1] Run authorized, unauthorized, invalid-input, unknown-ID, empty-result, and identity-service-failure smoke scenarios against existing routes using `inventory-service/specs/003-inventory-service-migration/quickstart.md`.
- [x] T027 [US1] Review characterization tests against `inventory-service/specs/003-inventory-service-migration/contracts/public-http.md` and record any contract mismatch before structural migration.

## Phase 4: User Story 2 - Layer Every Business Module

**Story Goal**: Move each module to the documented four-layer structure without changing behavior.

**Independent Test**: Every migrated module has domain ports, application inputs/use cases, Prisma adapters under persistence, HTTP DTOs/controllers under presentation, correct Nest wiring, focused tests, and no forbidden imports.

### Reference Data: Funding Source

- [x] T028 [US2] Create explicit repository port and plain input/output types in `inventory-service/src/inventory/reference-data/funding-source/domain/repositories/funding-source.repository.ts` from the current interface.
- [x] T029 [US2] Move and adapt the Prisma adapter to `inventory-service/src/inventory/reference-data/funding-source/infrastructure/persistence/prisma/prisma-funding-source.repository.ts`, mapping repository inputs explicitly and preserving lookup, list, create, update, and delete behavior.
- [x] T030 [US2] Move funding-source use cases into `inventory-service/src/inventory/reference-data/funding-source/application/use-cases/` with one plain input file per structured operation and no DTO imports.
- [x] T031 [US2] Move funding-source request and response DTOs and controller into `inventory-service/src/inventory/reference-data/funding-source/presentation/http/`, preserving routes, guards, permissions, Swagger metadata, pipes, and status codes.
- [x] T032 [US2] Rewire `inventory-service/src/inventory/reference-data/funding-source/funding-source.module.ts` with the abstract repository token, Prisma adapter, moved use cases, and HTTP controller; update `inventory-service/src/inventory/reference-data/reference-data.module.ts` consumers.
- [x] T033 [US2] Add funding-source use-case, repository, controller, and module wiring tests in `inventory-service/src/inventory/reference-data/funding-source/` and remove only obsolete empty directories.

### Reference Data: Location

- [x] T034 [US2] Create explicit repository port and plain input/output types in `inventory-service/src/inventory/reference-data/location/domain/repositories/location.repository.ts` from the current interface.
- [x] T035 [US2] Move and adapt the Prisma adapter to `inventory-service/src/inventory/reference-data/location/infrastructure/persistence/prisma/prisma-location.repository.ts`, mapping repository inputs explicitly and preserving lookup, list, create, update, and delete behavior.
- [x] T036 [US2] Move location use cases into `inventory-service/src/inventory/reference-data/location/application/use-cases/` with one plain input file per structured operation and no DTO imports.
- [x] T037 [US2] Move location request and response DTOs and controller into `inventory-service/src/inventory/reference-data/location/presentation/http/`, preserving routes, guards, permissions, Swagger metadata, pipes, and status codes.
- [x] T038 [US2] Rewire `inventory-service/src/inventory/reference-data/location/location.module.ts` with the abstract repository token, Prisma adapter, moved use cases, and HTTP controller; update `inventory-service/src/inventory/reference-data/reference-data.module.ts` consumers.
- [x] T039 [US2] Add location use-case, repository, controller, and module wiring tests in `inventory-service/src/inventory/reference-data/location/` and remove only obsolete empty directories.

### Reference Data: Status

- [x] T040 [US2] Create explicit repository port and plain input/output types in `inventory-service/src/inventory/reference-data/status/domain/repositories/status.repository.ts` from the current interface, including system-key and transaction-flag projections.
- [x] T041 [US2] Move and adapt the Prisma adapter to `inventory-service/src/inventory/reference-data/status/infrastructure/persistence/prisma/prisma-status.repository.ts`, mapping ORM enum and output fields explicitly while preserving lookup, list, create, update, and delete behavior.
- [x] T042 [US2] Move status use cases into `inventory-service/src/inventory/reference-data/status/application/use-cases/` with one plain input file per structured operation and no DTO imports.
- [x] T043 [US2] Move status request and response DTOs and controller into `inventory-service/src/inventory/reference-data/status/presentation/http/`, preserving routes, guards, permissions, Swagger metadata, pipes, and status codes.
- [x] T044 [US2] Rewire `inventory-service/src/inventory/reference-data/status/status.module.ts` with the abstract repository token, Prisma adapter, moved use cases, and HTTP controller; update metadata and module consumers under `inventory-service/src/inventory/reference-data/`.
- [x] T045 [US2] Add status use-case, repository, controller, and module wiring tests in `inventory-service/src/inventory/reference-data/status/` and remove only obsolete empty directories.

### Asset

- [x] T046 [US2] Move asset and asset-unit repository ports with explicit plain contracts into `inventory-service/src/inventory/asset/domain/repositories/asset.repository.ts` and `inventory-service/src/inventory/asset/domain/repositories/asset-unit.repository.ts`.
- [x] T047 [US2] Move asset persistence adapters into `inventory-service/src/inventory/asset/infrastructure/persistence/prisma/prisma-asset.repository.ts` and `inventory-service/src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.repository.ts`, preserving includes and output mapping.
- [x] T048 [US2] Move asset and asset-unit use cases into `inventory-service/src/inventory/asset/application/use-cases/` with one plain input file per structured operation and explicit Input-to-repository mapping.
- [x] T049 [US2] Move asset and asset-unit DTOs and controllers into `inventory-service/src/inventory/asset/presentation/http/`, preserving route paths, permissions, pipes, Swagger metadata, response DTOs, and status codes.
- [x] T050 [US2] Rewire `inventory-service/src/inventory/asset/asset.module.ts` and `inventory-service/src/inventory/asset/index.ts` for moved ports, adapters, use cases, controllers, and public exports without import cycles.
- [x] T051 [US2] Split or relocate asset persistence helpers under `inventory-service/src/inventory/asset/infrastructure/persistence/prisma/` when file budgets require it, keeping repository class behavior flat and explicit.
- [x] T052 [US2] Add focused asset use-case, repository, controller, and module wiring tests under `inventory-service/src/inventory/asset/` while preserving `inventory-service/src/inventory/asset/infrastructure/persistence/prisma-asset-unit.lendable.spec.ts` coverage.
- [x] T053 [US2] Remove stale asset imports and verify domain/application/presentation/infrastructure dependency direction under `inventory-service/src/inventory/asset/`.

### Circulation

- [x] T054 [US2] Move circulation repository ports and explicit plain contracts into `inventory-service/src/inventory/circulation/domain/repositories/`, separating loan, history, transaction-type, and cross-module capability shapes as needed.
- [x] T055 [US2] Move circulation persistence adapters into `inventory-service/src/inventory/circulation/infrastructure/persistence/prisma/`, preserving loan, loan-item, history, transaction-type, pagination, period, and output mapping behavior.
- [x] T056 [US2] Move all five circulation use cases into `inventory-service/src/inventory/circulation/application/use-cases/` with plain input files and explicit repository mapping.
- [x] T057 [US2] Move circulation DTOs and controllers into `inventory-service/src/inventory/circulation/presentation/http/`, preserving routes, permissions, validation, Swagger metadata, response DTOs, and status codes.
- [x] T058 [US2] Rewire `inventory-service/src/inventory/circulation/circulation.module.ts` and `inventory-service/src/inventory/circulation/index.ts` for moved ports, adapters, use cases, controllers, and public exports.
- [x] T059 [US2] Add repository and module wiring tests under `inventory-service/src/inventory/circulation/` using the characterization cases from `inventory-service/src/inventory/circulation/use-cases/`.
- [x] T060 [US2] Remove stale circulation imports and verify domain/application/presentation/infrastructure dependency direction under `inventory-service/src/inventory/circulation/`.

### Approval Structural Move

- [x] T061 [US2] Move approval repository port and plain contracts into `inventory-service/src/inventory/approval/domain/repositories/approval.repository.ts`, retaining workflow, step, instance, log, and pending projections without foreign Prisma types.
- [x] T062 [US2] Move approval Prisma adapter and includes into `inventory-service/src/inventory/approval/infrastructure/persistence/prisma/`, keeping only approval-owned model access until ownership tasks replace downstream operations.
- [x] T063 [US2] Move approval use cases into `inventory-service/src/inventory/approval/application/use-cases/` with plain inputs and explicit repository mapping, preserving current approval behavior.
- [x] T064 [US2] Move approval DTOs and controllers into `inventory-service/src/inventory/approval/presentation/http/`, preserving routes, permissions, validation, Swagger metadata, response DTOs, and status codes.
- [x] T065 [US2] Rewire `inventory-service/src/inventory/approval/approval.module.ts` and `inventory-service/src/inventory/approval/index.ts` for moved ports, adapters, use cases, controllers, and public exports.
- [x] T066 [US2] Add approval repository, controller, and module wiring tests under `inventory-service/src/inventory/approval/` and remove only obsolete empty directories.
- [x] T067 [US2] Remove stale approval imports and verify dependency direction under `inventory-service/src/inventory/approval/` without removing cross-module persistence until User Story 3 tasks are complete.

## Phase 5: User Story 3 - Enforce Table Ownership

**Story Goal**: Make each repository query and mutate only its owned Prisma models, using public ports for foreign data.

**Independent Test**: Static repository scan finds no cross-owner Prisma access, all 15 models have one owner, and local transactions contain only owned writes.

- [x] T068 [US3] Add narrow reference-data consumption ports to `inventory-service/src/inventory/asset/domain/repositories/` for category, funding-source, condition, status, and location lookups required by asset application operations.
- [x] T069 [US3] Replace direct `inventoryCategory` and other foreign-model access in `inventory-service/src/inventory/asset/infrastructure/persistence/prisma/prisma-asset.repository.ts` with injected owning-module ports while preserving result projections.
- [x] T070 [US3] Replace direct reference-model access in `inventory-service/src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.repository.ts` with public asset/reference capabilities and preserve lendability behavior.
- [x] T071 [US3] Define asset-owned unit mutation capabilities in `inventory-service/src/inventory/asset/domain/repositories/asset-unit.repository.ts` for callers that currently mutate units through circulation or approval repositories.
- [x] T072 [US3] Define circulation-owned loan, loan-item, history, and transaction-type capabilities in `inventory-service/src/inventory/circulation/domain/repositories/` for callers that currently reach through Prisma.
- [x] T073 [US3] Remove `inventoryAssetUnit`, `inventoryStatus`, and `approvalWorkflow` access from `inventory-service/src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.ts` and move cross-module sequencing to application orchestration.
- [x] T074 [US3] Replace `inventory-service/src/inventory/shared/infrastructure/inventory-unit-movement.steps.ts` Prisma writes with owning-module capabilities or move the helper into the owning module, preserving its self-check in `inventory-service/src/inventory/shared/infrastructure/inventory-unit-movement.steps.spec.ts`.
- [x] T075 [US3] Define approval-owned persistence boundaries in `inventory-service/src/inventory/approval/domain/repositories/approval.repository.ts` so workflow, instance, and log operations cannot accept circulation or asset Prisma clients.
- [x] T076 [US3] Remove loan, loan-item, asset-unit, history, status, and transaction-type Prisma access from `inventory-service/src/inventory/approval/infrastructure/persistence/prisma/prisma-approval.repository.ts` and replace it with public circulation and asset ports.
- [x] T077 [US3] Restrict local Prisma transactions in `inventory-service/src/inventory/circulation/infrastructure/persistence/prisma/` and `inventory-service/src/inventory/asset/infrastructure/persistence/prisma/` to writes owned by their module.
- [x] T078 [US3] Add module composition tests in `inventory-service/src/inventory/inventory.module.spec.ts` proving public ports resolve to adapters and no repository injects a foreign concrete adapter.
- [x] T079 [US3] Run a repository-wide model access review against `inventory-service/src/inventory/` and update `inventory-service/specs/003-inventory-service-migration/data-model.md` with final access evidence.
- [x] T080 [US3] Add regression tests under `inventory-service/src/inventory/asset/`, `inventory-service/src/inventory/circulation/`, and `inventory-service/src/inventory/approval/` for soft-delete filters, period scope, database-side role filtering, and no wide-read in-memory filtering.

## Phase 6: User Story 4 - Make Cross-Module Approval Repairable

**Story Goal**: Replace the approval repository's cross-module transaction with explicit, awaited, idempotent, visible orchestration.

**Independent Test**: Approval workflow state remains equivalent for approve/reject/next/final actions; downstream failure produces explicit retry or repair state; duplicate requests do not repeat side effects.

- [x] T081 [US4] Re-read approval characterization results and document current approve, reject, next-step, final-step, role mismatch, duplicate, and downstream failure outcomes in `inventory-service/specs/003-inventory-service-migration/research.md`.
- [x] T082 [US4] Define the smallest approval consequence and retry/repair contract in `inventory-service/specs/003-inventory-service-migration/contracts/approval-orchestration.md`, including whether existing `ApprovalLog` data is sufficient or a separately approved schema/API change is required.
- [x] T083 [US4] Add approval orchestration port types for circulation and asset consequences in `inventory-service/src/inventory/approval/domain/repositories/approval.repository.ts` or a sibling domain contract file, without Prisma or HTTP types.
- [x] T084 [US4] Split `processApprovalTransaction` application behavior from `inventory-service/src/inventory/approval/infrastructure/persistence/prisma/prisma-approval.repository.ts` into local approval persistence plus awaited downstream calls in `inventory-service/src/inventory/approval/application/use-cases/process-approval/`.
- [x] T085 [US4] Implement idempotency and retry detection for approval actions in `inventory-service/src/inventory/approval/application/use-cases/process-approval/`, preserving current natural identity and duplicate behavior documented in characterization tests.
- [x] T086 [US4] Implement explicit downstream failure and repair-state handling in `inventory-service/src/inventory/approval/application/use-cases/process-approval/` according to `inventory-service/specs/003-inventory-service-migration/contracts/approval-orchestration.md`; stop and update the contract if schema change is required.
- [x] T087 [US4] Push pending-approval role filtering into Prisma query predicates in `inventory-service/src/inventory/approval/infrastructure/persistence/prisma/prisma-approval.repository.ts` while preserving role-code matching and visibility rules.
- [x] T088 [US4] Replace pending-approval N+1 reads with one repository projection or bounded query in `inventory-service/src/inventory/approval/infrastructure/persistence/prisma/prisma-approval.repository.ts` and preserve response mapping.
- [x] T089 [US4] Add approval process tests in `inventory-service/src/inventory/approval/application/use-cases/process-approval/process-approval.use-case.spec.ts` for all action states, retries, role mismatch, and downstream failure repair.
- [x] T090 [US4] Add approval repository tests beside `inventory-service/src/inventory/approval/infrastructure/persistence/prisma/` proving owner-only Prisma access, database-side role filtering, no N+1 query, and explicit failure projection.

## Phase 7: User Story 5 - Establish Repeatable Migration Gates

**Story Goal**: Make each migration slice and final service state measurable through repeatable tests and static review.

**Independent Test**: Each wave has focused tests and review evidence; final `pnpm run validate` passes with no forbidden imports, stale paths, ownership violations, or contract drift.

- [x] T091 [US5] Add per-wave verification evidence and residual-risk sections to `inventory-service/specs/003-inventory-service-migration/quickstart.md`.
- [x] T092 [US5] Review all migrated module files against line budgets and split over-budget use cases, repositories, controllers, or other files under their owning `inventory-service/src/inventory/` module.
- [x] T093 [US5] Run stale-layout, DTO-leak, Prisma-leak, concrete-adapter, role-bypass, and cross-owner repository scans across `inventory-service/src/inventory/` and record zero-result evidence in `inventory-service/specs/003-inventory-service-migration/checklists/requirements.md`.
- [x] T094 [US5] Run focused ESM-safe Jest suites for reference-data, asset, circulation, approval, shared, and composition paths from `inventory-service` and record counts in `inventory-service/specs/003-inventory-service-migration/quickstart.md`.
- [x] T095 [US5] Run `pnpm run validate` from `inventory-service` and record format, lint, typecheck, strict lint, test, and build evidence in `inventory-service/specs/003-inventory-service-migration/quickstart.md`.

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T096 Remove obsolete empty directories and stale imports under `inventory-service/src/inventory/` without deleting active test or public API files.
- [x] T097 Verify every API response still uses `{ statusCode, message, data, meta? }` and document any intentional exception in `inventory-service/specs/003-inventory-service-migration/contracts/public-http.md`.
- [x] T098 Verify every soft-deletable query includes `deletedAt: null`, every period query scopes in its repository `where`, and every month bound uses `gte`/`lt` under `inventory-service/src/inventory/`.
- [x] T099 Verify `SUPER_ADMIN` bypass exists only in `inventory-service/src/platform/access-control/permission/guards/permission.guard.ts` and no inventory controller, use case, or repository compares role names or codes for authorization.
- [x] T100 Update measured module status, ownership matrix, migration order, and validation evidence in `inventory-service/docs/ARCHITECTURE.md`.
- [x] T101 Update final task evidence and residual risks in `inventory-service/specs/003-inventory-service-migration/quickstart.md` without adding generic architecture commentary.
- [x] T102 Run `pnpm run validate` from `inventory-service` after all documentation and source cleanup.
- [x] T103 Review `inventory-service/specs/003-inventory-service-migration/` for stale claims, missing file paths, unresolved decisions, and accidental `tasks.md` scope expansion.

## Dependencies

```text
T001-T006
  -> T007-T012
  -> T013-T027 (US1 characterization)
  -> T028-T067 (US2 layering)
  -> T068-T080 (US3 ownership)
  -> T081-T090 (US4 approval orchestration)
  -> T091-T095 (US5 verification gates)
  -> T096-T103 (polish)
```

Detailed dependency edges:

```text
T001 + T002 + T003 -> T004 -> T005 -> T006
T006 -> T007 -> T008 -> T009 -> T010 -> T011 -> T012
T012 -> T013 + T014 + T015 + T016 + T017 + T018 + T019 + T020 + T021
T013-T021 -> T022 -> T023 -> T024 -> T025 -> T026 -> T027
T027 -> T028 -> T029 -> T030 -> T031 -> T032 -> T033
T033 -> T034 -> T035 -> T036 -> T037 -> T038 -> T039
T039 -> T040 -> T041 -> T042 -> T043 -> T044 -> T045
T045 -> T046 -> T047 -> T048 -> T049 -> T050 -> T051 -> T052 -> T053
T053 -> T054 -> T055 -> T056 -> T057 -> T058 -> T059 -> T060
T060 -> T061 -> T062 -> T063 -> T064 -> T065 -> T066 -> T067
T067 -> T068 -> T069 -> T070 -> T071 -> T072 -> T073 -> T074 -> T075 -> T076 -> T077 -> T078 -> T079 -> T080
T080 -> T081 -> T082 -> T083 -> T084 -> T085 -> T086 -> T087 -> T088 -> T089 -> T090
T090 -> T091 -> T092 -> T093 -> T094 -> T095
T095 -> T096 -> T097 -> T098 -> T099 -> T100 -> T101 -> T102 -> T103
```

## Parallel Opportunities

- T001, T002, T003 can run in parallel because they update separate planning records.
- T013 through T021 can run in parallel because each targets a separate controller or test seam; T022-T024 remain dependent on the resulting characterization baseline.
- Within each reference-data module, repository-port, adapter, application, and presentation work must remain ordered; complete funding-source before location, then status.
- Asset and circulation layering cannot run in parallel because circulation consumes asset public capabilities.
- T068, T072, and T075 can be designed in parallel after T067 because they target separate port contracts; implementation T069-T077 stays ordered by ownership.
- T081 and T082 can be prepared in parallel after T080; T083 onward must wait for the approved orchestration contract.
- T092 and T093 can run in parallel after T091. T094 must follow all source changes. T096-T099 can run in parallel after T095; documentation tasks T100-T103 remain final.

## Implementation Strategy

1. **MVP**: T001-T027. Baseline and characterization only. This gives safe behavior evidence before structural changes.
2. **Increment 1**: T028-T045. Finish remaining reference-data layering and validate each module independently.
3. **Increment 2**: T046-T067. Layer asset, circulation, and approval while preserving the current approval transaction temporarily.
4. **Increment 3**: T068-T080. Enforce all model ownership and remove cross-owner Prisma access.
5. **Increment 4**: T081-T090. Replace approval cross-module transaction with explicit repairable orchestration.
6. **Release gate**: T091-T103. Static checks, full validation, documentation review, and residual-risk review are complete.

MVP wording above is historical planning scope. Final implementation covers asset, circulation, approval ownership, approval repairability, and release gates.

## Format Validation

Every executable task uses `- [ ]`, sequential `Txxx` ID, optional `[P]`, required `[USx]` label only in user-story phases, and an explicit project-relative file path. Setup, foundational, and polish tasks intentionally omit story labels per Speckit rules.
