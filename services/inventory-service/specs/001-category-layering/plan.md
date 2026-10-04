# Category Module Layering Implementation Plan

**Feature**: `reference-data/category` layering rehearsal
**Spec**: `specs/001-category-layering/spec.md`
**Architecture**: Move the existing category module into the repository's layered structure. Keep HTTP and persistence behavior unchanged. Put repository contracts in domain, use-case inputs in application, Prisma in infrastructure, and HTTP DTOs/controllers in presentation.
**Tech Stack**: NestJS 12, TypeScript 5.9, Prisma 7, PostgreSQL, Jest 30, NodeNext ESM, pnpm.

## Global Constraints

- Preserve all existing category routes, permission codes, status codes, response shapes, validation, search semantics, ordering, and not-found behavior.
- `presentation -> application -> domain`; `infrastructure -> domain`.
- Domain and application must not import Prisma types or HTTP DTOs.
- Only `infrastructure/persistence/prisma/` may import Prisma persistence types or `PrismaService`.
- One use case per file.
- Repository port input/output types live beside the abstract port.
- No new runtime dependency, endpoint, migration, event mechanism, generic base class, or unrelated refactor.
- Preserve existing test coverage and add tests for the migrated seams.
- Run `pnpm run validate` before completion.

## File Map

| File group | Responsibility |
|---|---|
| `src/inventory/reference-data/category/domain/` | Entity shape and repository port. |
| `src/inventory/reference-data/category/application/` | Four category operations and plain inputs. |
| `src/inventory/reference-data/category/infrastructure/persistence/prisma/` | Prisma repository adapter. |
| `src/inventory/reference-data/category/presentation/http/` | HTTP controller and DTOs. |
| `src/inventory/reference-data/category/category.module.ts` | Nest provider wiring. |
| `src/inventory/reference-data/category/*.spec.ts` | Focused behavior and dependency tests. |

## Task 1: Capture Current Behavior

**Files:**

- Create: `src/inventory/reference-data/category/application/use-cases/category-use-cases.spec.ts` or split operation specs beside each use case, following the existing service test convention.
- Create: repository behavior spec beside the Prisma adapter if repository behavior is not already covered.

**Work:**

1. Write tests for create mapping, get search forwarding, update not-found behavior, update mapping, delete not-found behavior, and delete delegation.
2. Write repository tests for case-insensitive code/name search and ascending name ordering using the existing repository test approach.
3. Run `pnpm exec jest --testPathPatterns=reference-data/category` and confirm the behavior tests pass against the current implementation.

## Task 2: Move the Repository Port

**Files:**

- Move: `src/inventory/reference-data/category/domain/interfaces/category-repository.interface.ts` to `src/inventory/reference-data/category/domain/repositories/category.repository.ts`.
- Modify: repository port types in `category.repository.ts`.
- Modify: imports in module and Prisma adapter.

**Work:**

1. Keep the abstract port name `ICategoryRepository` unless the existing repository-wide naming convention requires otherwise.
2. Define plain `CategoryCreateRepositoryInput`, `CategoryUpdateRepositoryInput`, and output types beside the port.
3. Remove Prisma input/output types from the port.
4. Keep method semantics unchanged: `findMany`, `findById`, `create`, `update`, `delete`.
5. Run focused tests and `pnpm run typecheck`.

## Task 3: Move and Adapt Prisma Infrastructure

**Files:**

- Move: `src/inventory/reference-data/category/infrastructure/persistence/prisma-category.repository.ts` to `src/inventory/reference-data/category/infrastructure/persistence/prisma/prisma-category.repository.ts`.
- Modify: `prisma-category.repository.ts`.

**Work:**

1. Keep all Prisma imports inside the adapter.
2. Map repository input types explicitly to Prisma create/update data fields.
3. Preserve current search predicate and `name asc` ordering.
4. Preserve current `findById`, create, update, and delete behavior.
5. Run repository tests and `pnpm run typecheck`.

## Task 4: Move Use Cases into Application

**Files:**

- Move: `use-cases/create-category.use-case.ts` to `application/use-cases/create-category/create-category.use-case.ts`.
- Move: `use-cases/get-categories.use-case.ts` to `application/use-cases/get-categories/get-categories.use-case.ts`.
- Move: `use-cases/update-category.use-case.ts` to `application/use-cases/update-category/update-category.use-case.ts`.
- Move: `use-cases/delete-category.use-case.ts` to `application/use-cases/delete-category/delete-category.use-case.ts`.
- Create: `create-category.input.ts` and `update-category.input.ts`.

**Work:**

1. Change use-case imports to the new repository port.
2. Replace DTO type names with plain application input types.
3. Preserve field-by-field mapping from input to repository input.
4. Keep `NotFoundException` behavior in update/delete.
5. Keep `GetCategoriesUseCase.execute(search?: string)` unchanged in behavior.
6. Keep one use case per file and colocate its spec with the use case where practical.
7. Run focused tests and `pnpm run typecheck`.

## Task 5: Move HTTP Presentation

**Files:**

- Move: `presentation/category.controller.ts` to `presentation/http/category.controller.ts`.
- Move: `dto/request/create-category.dto.ts` to `presentation/http/dto/request/create-category.dto.ts`.
- Move: `dto/request/update-category.dto.ts` to `presentation/http/dto/request/update-category.dto.ts`.
- Move: `dto/response/category-response.dto.ts` to `presentation/http/dto/response/category-response.dto.ts`.

**Work:**

1. Fix relative imports only.
2. Keep route, guards, permission decorators, Swagger decorators, status codes, and controller method behavior unchanged.
3. Keep controller dependency limited to use cases and HTTP DTOs.
4. Run focused tests and `pnpm run typecheck`.

## Task 6: Rewire the Nest Module

**Files:**

- Modify: `src/inventory/reference-data/category/category.module.ts`.

**Work:**

1. Update provider imports to new paths.
2. Keep `{ provide: ICategoryRepository, useClass: PrismaCategoryRepository }` behavior.
3. Keep all four use cases and the controller registered.
4. Confirm no stale old-layout imports remain under `src/inventory/reference-data/category/`.
5. Run focused tests and full typecheck.

## Task 7: Verify the Rehearsal

**Files:**

- Modify: `docs/ARCHITECTURE.md` only if the documented category procedure needs a factual correction after implementation.

**Work:**

1. Check dependency imports with repository search.
2. Run `pnpm exec jest --testPathPatterns=reference-data/category`.
3. Run `pnpm run format:check`.
4. Run `pnpm run lint`.
5. Run `pnpm run typecheck`.
6. Run `pnpm run lint:strict`.
7. Run `pnpm test`.
8. Run `pnpm run build`.
9. Run `pnpm run validate` once as the final combined gate.
10. Review `git diff --stat` and confirm only category migration files, tests, and explicitly required docs changed.

## Dependency Graph

```text
T001 behavior tests
  -> T002 repository port
  -> T003 Prisma adapter
  -> T004 application use cases
  -> T005 HTTP presentation
  -> T006 module wiring
  -> T007 final verification
```

## MVP

The MVP is the complete category migration through T006 with focused tests and a passing typecheck. T007 is required before merge and proves the service-wide quality gate.
