# Condition Module Layering Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with Superpowers subagent-driven development. Anti-Slop applies during implementation. Do not add behavior or abstractions outside this plan.

**Goal:** Migrate `reference-data/condition` to the target layered structure while preserving every existing HTTP and persistence behavior.

**Architecture:** Match the completed `reference-data/category` module. Domain owns the repository port and entity shape, application owns plain use-case inputs and operations, infrastructure owns Prisma mapping, and presentation owns HTTP controllers and DTOs. `GetMetadataUseCase` consumes the condition port only through the module public index.

**Tech Stack:** NestJS 12, TypeScript 5.9, Prisma 7, Jest 30, NodeNext ESM, pnpm.

**Spec:** `specs/002-condition-layering/spec.md`

## Global Constraints

- Preserve all existing condition routes, permission codes, status codes, response shape, validation, search semantics, ordering, `isUsable` defaults, and not-found behavior.
- Follow `presentation -> application -> domain`; `infrastructure -> domain`.
- Domain and application must not import Prisma types, `PrismaService`, or HTTP DTOs.
- Only `infrastructure/persistence/prisma/` may import Prisma persistence types or `PrismaService`.
- One use case per file. Structured application inputs are plain TypeScript types without decorators.
- `GetMetadataUseCase` must import the condition repository from `condition/index.ts`, not an internal path.
- No new runtime dependency, endpoint, migration, event mechanism, generic base class, or unrelated refactor.
- Preserve existing behavior coverage and add focused tests for use-case, repository, controller, and boundary seams.
- Run `pnpm run validate` before completion.

---

## File Map

| File group | Responsibility |
|---|---|
| `src/inventory/reference-data/condition/domain/` | Entity and repository port. |
| `src/inventory/reference-data/condition/application/` | Four condition operations and plain inputs. |
| `src/inventory/reference-data/condition/infrastructure/persistence/prisma/` | Prisma adapter and repository tests. |
| `src/inventory/reference-data/condition/presentation/http/` | Controller and HTTP DTOs/tests. |
| `src/inventory/reference-data/condition/index.ts` | Public repository port and repository types. |
| `src/inventory/reference-data/condition/condition.module.ts` | Nest provider wiring. |
| `src/inventory/reference-data/use-cases/get-metadata.use-case.ts` | External consumer import fix. |

## Task 1: Add failing behavior tests

**Files:**
- Create: `src/inventory/reference-data/condition/application/use-cases/condition-use-cases.spec.ts`
- Create: `src/inventory/reference-data/condition/infrastructure/persistence/prisma/prisma-condition.repository.spec.ts`
- Create: `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`

**Steps:**
- Write use-case tests for create mapping/default, search forwarding, update not-found/mapping, and delete not-found/delegation.
- Write repository tests for case-insensitive code/name search, ascending name ordering, and mapping of persistence output.
- Write controller tests for delegation, route/permission metadata, no-content delete status, DTO validation metadata, UUID pipes, guard, and Swagger contracts.
- Run the focused test command and confirm new tests fail only because the target layered imports/files do not exist yet.

## Task 2: Move domain port and create public API

**Files:**
- Create: `src/inventory/reference-data/condition/domain/repositories/condition.repository.ts`
- Create: `src/inventory/reference-data/condition/index.ts`
- Delete: `src/inventory/reference-data/condition/domain/interfaces/condition-repository.interface.ts`

**Steps:**
- Preserve `IConditionRepository` as the Nest token.
- Define plain `ConditionCreateRepositoryInput`, `ConditionUpdateRepositoryInput`, and `ConditionRepositoryOutput` beside the port.
- Preserve methods `findMany`, `findById`, `create`, `update`, and `delete`.
- Export the token and types from `condition/index.ts`.
- Run focused tests and typecheck.

## Task 3: Move and isolate Prisma adapter

**Files:**
- Create: `src/inventory/reference-data/condition/infrastructure/persistence/prisma/prisma-condition.repository.ts`
- Delete: `src/inventory/reference-data/condition/infrastructure/persistence/prisma-condition.repository.ts`

**Steps:**
- Move the adapter under `infrastructure/persistence/prisma/` and rename it `PrismaConditionRepository`.
- Keep Prisma imports and `PrismaService` use inside this adapter only.
- Map repository inputs explicitly to Prisma data types and map persistence rows to the domain output shape.
- Preserve current search predicate, ordering, lookup, create, update, and delete semantics.
- Run repository tests and typecheck.

## Task 4: Move use cases into application

**Files:**
- Create: `src/inventory/reference-data/condition/application/use-cases/create-condition/create-condition.input.ts`
- Create: `src/inventory/reference-data/condition/application/use-cases/create-condition/create-condition.use-case.ts`
- Create: `src/inventory/reference-data/condition/application/use-cases/get-conditions/get-conditions.use-case.ts`
- Create: `src/inventory/reference-data/condition/application/use-cases/update-condition/update-condition.input.ts`
- Create: `src/inventory/reference-data/condition/application/use-cases/update-condition/update-condition.use-case.ts`
- Create: `src/inventory/reference-data/condition/application/use-cases/delete-condition/delete-condition.use-case.ts`
- Delete: `src/inventory/reference-data/condition/use-cases/create-condition.use-case.ts`
- Delete: `src/inventory/reference-data/condition/use-cases/get-conditions.use-case.ts`
- Delete: `src/inventory/reference-data/condition/use-cases/update-condition.use-case.ts`
- Delete: `src/inventory/reference-data/condition/use-cases/delete-condition.use-case.ts`

**Steps:**
- Change repository imports to `domain/repositories/condition.repository.ts`.
- Replace DTO parameter types with plain application input types.
- Preserve `isUsable ?? true` on create and update.
- Preserve `NotFoundException` behavior and messages on update/delete.
- Preserve `execute(search?: string)` behavior for listing.
- Run focused use-case tests and typecheck.

## Task 5: Move HTTP presentation

**Files:**
- Create: `src/inventory/reference-data/condition/presentation/http/condition.controller.ts`
- Create: `src/inventory/reference-data/condition/presentation/http/dto/request/create-condition.dto.ts`
- Create: `src/inventory/reference-data/condition/presentation/http/dto/request/update-condition.dto.ts`
- Create: `src/inventory/reference-data/condition/presentation/http/dto/response/condition-response.dto.ts`
- Delete: `src/inventory/reference-data/condition/presentation/condition.controller.ts`
- Delete: `src/inventory/reference-data/condition/dto/request/create-condition.dto.ts`
- Delete: `src/inventory/reference-data/condition/dto/request/update-condition.dto.ts`
- Delete: `src/inventory/reference-data/condition/dto/response/condition-response.dto.ts`

**Steps:**
- Fix only relative imports and application use-case paths.
- Preserve controller route, guard, permissions, Swagger metadata, UUID pipes, status codes, and method behavior.
- Keep presentation dependent on use cases and HTTP DTOs, never repository or Prisma.
- Run controller tests and typecheck.

## Task 6: Rewire module and metadata consumer

**Files:**
- Modify: `src/inventory/reference-data/condition/condition.module.ts`
- Modify: `src/inventory/reference-data/use-cases/get-metadata.use-case.ts`
- Modify: `src/inventory/reference-data/dto/response/metadata-response.dto.ts`

**Steps:**
- Register `ConditionController`, four moved use cases, `IConditionRepository`, and `PrismaConditionRepository` with the existing provider token behavior.
- Change metadata use-case repository import to `../condition/index.js`.
- Change metadata response DTO import to the condition HTTP DTO location.
- Confirm no stale condition imports remain under `src/inventory/reference-data/`.
- Run focused tests, metadata tests, and typecheck.

## Task 7: Verify and review

**Files:**
- Modify: `docs/ARCHITECTURE.md` only if verification finds a factual error.

**Steps:**
- Verify dependency direction with repository search.
- Run focused condition tests.
- Run `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run lint:strict`, `pnpm test`, `pnpm run build`, and `pnpm run validate`.
- Review the final diff for scope, stale paths, comments, and unnecessary abstractions using Anti-Slop.
- Record test evidence and residual risks in the implementation report.

## Dependency Graph

```text
T001 behavior tests
  -> T002 domain port/public API
  -> T003 Prisma adapter
  -> T004 application use cases
  -> T005 HTTP presentation
  -> T006 module and consumer wiring
  -> T007 verification/review
```

## MVP

T001 through T006: complete condition migration with focused tests and working wiring. T007 is required before claiming completion.
