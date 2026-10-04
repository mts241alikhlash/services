# Feature Specification: Category Module Layering

**Feature Branch**: `001-category-layering`
**Created**: 2026-09-13
**Status**: Draft for review
**Input**: Migrate `reference-data/category` to the repository's target layered module structure without changing behavior or HTTP contracts.

## User Scenarios & Testing

### User Story 1 - Keep Category Management Behavior Unchanged (Priority: P1)

As an inventory administrator, I need category list, create, update, and delete operations to behave exactly as they do now while the module structure changes, so existing inventory workflows remain safe.

**Why this priority**: Category is the first migration rehearsal. Existing users and clients must not see a behavior change.

**Independent Test**: Exercise all four category routes with valid and invalid inputs, then compare status codes, response data, permissions, search behavior, ordering, and not-found behavior with the current contract.

**Acceptance Scenarios**:

1. **Given** an authorized caller, **When** they request `GET /inventory/categories` without search, **Then** category records are returned using the current query semantics, ascending name order, and existing response envelope.
2. **Given** an authorized caller, **When** they request `GET /inventory/categories?search=term`, **Then** matching code or name values are returned using the existing case-insensitive search behavior.
3. **Given** an authorized caller and valid category data, **When** they create a category, **Then** the category is persisted and the existing response shape and status are returned.
4. **Given** an authorized caller and an existing category ID, **When** they update the category, **Then** only supplied category fields are changed and the existing response shape and status are returned.
5. **Given** an authorized caller and an existing category ID, **When** they delete the category, **Then** the category is deleted using the existing behavior and the endpoint returns the existing no-content status.
6. **Given** an authorized caller and an unknown category ID, **When** they update or delete the category, **Then** the endpoint returns the existing not-found error.
7. **Given** a caller without the required permission, **When** they call any category route, **Then** authorization behavior remains unchanged.

### User Story 2 - Enforce Layered Module Dependencies (Priority: P1)

As a maintainer, I need category business operations to depend on a domain repository port instead of HTTP DTOs or Prisma types, so the use cases can be tested without a database and future adapters can replace Prisma locally.

**Why this priority**: This is the purpose of the migration and the acceptance boundary for the rehearsal.

**Independent Test**: Static dependency checks and unit tests prove that use cases import only application/domain types, the domain has no Prisma or presentation imports, and only the Prisma adapter imports Prisma.

**Acceptance Scenarios**:

1. **Given** the category module source, **When** imports are inspected, **Then** dependencies follow `presentation -> application -> domain` and `infrastructure -> domain`.
2. **Given** a category use case test, **When** it runs with an in-memory repository double, **Then** it does not require Nest application boot, Prisma, or a database.
3. **Given** a category repository port, **When** its input and output types are inspected, **Then** they are declared beside the port and do not expose Prisma types or HTTP DTOs.
4. **Given** the category module provider configuration, **When** dependencies are resolved, **Then** the domain repository port is implemented by the Prisma adapter through the existing NestJS provider token.
5. **Given** the migration, **When** files are reviewed, **Then** each use case has one file and any structured use case input is a plain application input type without validation or Swagger decorators.

### User Story 3 - Preserve a Reusable Migration Pattern (Priority: P2)

As a maintainer, I need the migrated category module to establish the repository's documented structure and verification sequence, so the same pattern can be reused for the other inventory reference-data modules.

**Why this priority**: Category is intentionally a rehearsal, not a one-off rewrite.

**Independent Test**: A maintainer can locate the module's port, use cases, adapter, controller, DTOs, and tests from the documented structure, then run the module test and full validation commands successfully.

**Acceptance Scenarios**:

1. **Given** the migrated module, **When** its files are compared with `inventory-service/docs/ARCHITECTURE.md`, **Then** the module follows the documented target layout.
2. **Given** the migration test sequence, **When** module tests and the service validation pipeline run, **Then** formatting, lint, typecheck, strict lint, tests, and build pass.
3. **Given** a later reference-data migration, **When** a maintainer uses category as the template, **Then** no category-specific HTTP or database contract knowledge is required outside the module's public interface.

## Functional Requirements

- **FR-001**: The migration MUST preserve all existing category routes, HTTP methods, route parameters, permission codes, response envelope, status codes, and validation behavior.
- **FR-002**: The migration MUST preserve category search semantics, including case-insensitive matching against code and name and ascending name ordering.
- **FR-003**: The migration MUST preserve existing not-found behavior for update and delete operations.
- **FR-004**: The category module MUST use the dependency flow `presentation -> application -> domain` and `infrastructure -> domain`.
- **FR-005**: Category use cases MUST NOT import request or response DTOs, Prisma types, `PrismaService`, controllers, or infrastructure implementations.
- **FR-006**: The category domain MUST NOT import NestJS presentation classes, HTTP DTOs, Prisma packages, or infrastructure implementations.
- **FR-007**: The category repository port MUST declare plain input and output types next to its abstract interface and MUST NOT expose Prisma types.
- **FR-008**: The Prisma repository adapter MUST be the only category module layer that imports Prisma persistence types or `PrismaService`.
- **FR-009**: Each category use case MUST live in its own application use-case folder and file.
- **FR-010**: Structured use case inputs MUST be plain TypeScript types without class-validator or Swagger decorators.
- **FR-011**: Existing tests MUST remain present and behavior coverage MUST NOT be reduced. New tests MUST cover the migrated use-case seams and repository behavior required to prove FR-001 through FR-010.
- **FR-012**: The migration MUST not add a new runtime dependency, cross-service call, database table, migration, endpoint, or asynchronous event mechanism.
- **FR-013**: The migration MUST pass the service validation sequence: format check, lint, typecheck, strict lint, tests, and build.
- **FR-014**: The migration documentation MUST identify the category module as the reference pattern for the next inventory reference-data migrations.

## Key Entities

### Inventory Category

- `id`: existing category identifier
- `code`: existing category code
- `name`: existing category name
- `depreciationRatePercent`: existing optional depreciation rate used by persistence and request contracts
- `deletedAt`: existing soft-delete/persistence field where applicable

No entity fields, database schema, or lifecycle states change in this feature.

## Assumptions

- The current category HTTP contract is authoritative and remains unchanged.
- The existing category repository behavior is the intended behavior, including hard delete if that is what the current adapter performs.
- No external caller imports category source files; only the category module's NestJS registration and HTTP routes are externally relevant.
- Existing repository conventions in `inventory-service/docs/CONSTITUTION.md` and `docs/ARCHITECTURE.md` take precedence over generic layering conventions.
- The implementation uses existing dependencies only. No generated client, event bus, mapper framework, or new abstraction layer is needed.

## Out of Scope

- Migrating `condition`, `funding-source`, `location`, or `status`.
- Migrating `asset`, `circulation`, or `approval`.
- Changing category business rules, validation rules, permissions, routes, response DTOs, or database behavior.
- Adding category soft-delete behavior if it does not already exist.
- Introducing domain events, shared base classes, generic repositories, or cross-service contracts.

## Success Criteria

- **SC-001**: Existing category callers can use all four category routes without changing request or response handling.
- **SC-002**: Category use cases can run in isolation with a repository double and no database connection.
- **SC-003**: Static inspection finds no application-to-presentation, application-to-Prisma, domain-to-Prisma, or presentation-to-repository dependency in the migrated category module.
- **SC-004**: The category module has one use case per file and follows the target layout documented in `docs/ARCHITECTURE.md`.
- **SC-005**: The module test suite and full `pnpm run validate` command pass after migration.
- **SC-006**: A later maintainer can use the migrated category module as a direct structural template for another reference-data module without adding a new pattern.
