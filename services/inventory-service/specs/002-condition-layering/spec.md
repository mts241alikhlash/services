# Feature Specification: Condition Module Layering

**Feature Branch**: `002-condition-layering`
**Created**: 2026-09-14
**Status**: Ready for implementation
**Input**: Migrate `reference-data/condition` to the repository's target layered module structure without changing behavior or HTTP contracts.

## User Scenarios & Testing

### User Story 1 - Keep Condition Management Behavior Unchanged (Priority: P1)

As an inventory administrator, I need condition list, create, update, and delete operations to behave exactly as they do now while the module structure changes, so asset workflows remain safe.

**Why this priority**: Condition is the second reference-data migration. Existing callers must not see a behavior change.

**Independent Test**: Exercise all four condition routes with valid and invalid inputs, then compare status codes, response data, permissions, search behavior, ordering, and not-found behavior with the current contract.

**Acceptance Scenarios**:

1. **Given** an authorized caller, **When** they request `GET /inventory/conditions` without search, **Then** condition records are returned using the current query semantics, ascending name order, and existing response shape.
2. **Given** an authorized caller, **When** they request `GET /inventory/conditions?search=term`, **Then** matching code or name values are returned using the existing case-insensitive search behavior.
3. **Given** an authorized caller and valid condition data, **When** they create a condition, **Then** the condition is persisted and the existing response shape and status are returned.
4. **Given** an authorized caller and an existing condition ID, **When** they update the condition, **Then** the existing update behavior and response contract are preserved.
5. **Given** an authorized caller and an existing condition ID, **When** they delete the condition, **Then** the condition is deleted using the existing behavior and the endpoint returns the existing no-content status.
6. **Given** an authorized caller and an unknown condition ID, **When** they update or delete the condition, **Then** the endpoint returns the existing not-found error.
7. **Given** a caller without the required permission, **When** they call any condition route, **Then** authorization behavior remains unchanged.

### User Story 2 - Enforce Layered Module Dependencies (Priority: P1)

As a maintainer, I need condition operations to depend on a domain repository port instead of HTTP DTOs or Prisma types, so use cases can run without a database and the persistence adapter stays replaceable.

**Why this priority**: This is the purpose of the migration.

**Independent Test**: Static dependency checks and unit tests prove that use cases import only application/domain types, the domain has no Prisma or presentation imports, and only the Prisma adapter imports Prisma.

**Acceptance Scenarios**:

1. **Given** the condition module source, **When** imports are inspected, **Then** dependencies follow `presentation -> application -> domain` and `infrastructure -> domain`.
2. **Given** condition use-case tests, **When** they run with an in-memory repository double, **Then** they do not require Nest application boot, Prisma, or a database.
3. **Given** a condition repository port, **When** its input and output types are inspected, **Then** they are plain types beside the port and do not expose Prisma types or HTTP DTOs.
4. **Given** the condition module provider configuration, **When** dependencies are resolved, **Then** the repository port is implemented by the Prisma adapter through the existing Nest provider token.
5. **Given** the migration, **When** files are reviewed, **Then** each use case has one file and structured inputs are plain application types without validation or Swagger decorators.

### User Story 3 - Establish the Reusable Reference-Data Pattern (Priority: P2)

As a maintainer, I need condition to follow the completed category pattern, so the remaining reference-data migrations can be mechanical and independently verified.

**Why this priority**: Category is the template; condition validates that the pattern is reusable beyond one module.

**Independent Test**: A maintainer can locate the condition port, use cases, adapter, controller, DTOs, and tests from the documented structure, then run focused tests and the full validation command.

**Acceptance Scenarios**:

1. **Given** the migrated module, **When** its files are compared with `docs/ARCHITECTURE.md` and `reference-data/category`, **Then** condition follows the same target layout.
2. **Given** the migration test sequence, **When** focused tests and service validation run, **Then** formatting, lint, typecheck, strict lint, tests, and build pass.
3. **Given** a later reference-data migration, **When** a maintainer uses condition or category as a template, **Then** no internal condition file path is required outside the module's public repository interface.

## Functional Requirements

- **FR-001**: Preserve all existing condition routes, HTTP methods, route parameters, permission codes, response shape, status codes, validation behavior, and not-found behavior.
- **FR-002**: Preserve condition search semantics, including case-insensitive matching against code and name and ascending name ordering.
- **FR-003**: Preserve the existing `isUsable` default and update behavior.
- **FR-004**: Use dependency flow `presentation -> application -> domain` and `infrastructure -> domain`.
- **FR-005**: Condition use cases MUST NOT import request or response DTOs, Prisma types, `PrismaService`, controllers, or infrastructure implementations.
- **FR-006**: Condition domain MUST NOT import NestJS presentation classes, HTTP DTOs, Prisma packages, or infrastructure implementations.
- **FR-007**: Condition repository port input and output types MUST be plain types beside the abstract port and MUST NOT expose Prisma types.
- **FR-008**: The Prisma repository adapter MUST be the only condition module layer importing Prisma persistence types or `PrismaService`.
- **FR-009**: Each condition use case MUST live in its own application use-case folder and file.
- **FR-010**: Structured use-case inputs MUST be plain TypeScript types without class-validator or Swagger decorators.
- **FR-011**: Tests MUST cover use-case mappings, not-found behavior, repository search/order behavior, controller delegation, route metadata, and dependency boundaries.
- **FR-012**: Do not add runtime dependencies, endpoints, migrations, events, generic base classes, or unrelated refactors.
- **FR-013**: Run the service validation sequence: format check, lint, typecheck, strict lint, tests, and build.
- **FR-014**: Update migration documentation only if a factual correction is required; otherwise keep this slice source- and test-scoped.

## Key Entities

### Inventory Condition

- `id`: existing condition identifier
- `code`: existing condition code
- `name`: existing condition name
- `isUsable`: existing flag controlling whether assets in this condition may be lent
- `createdAt`: existing persistence timestamp exposed by the response contract

No entity fields, database schema, or lifecycle states change.

## Assumptions

- The current condition HTTP contract is authoritative.
- Existing hard-delete behavior remains unchanged.
- Existing Prisma query semantics remain unchanged, including the current lack of explicit soft-delete filtering.
- `GetMetadataUseCase` is an external consumer and must be updated to import the condition repository through `condition/index.ts`.
- Existing dependencies are sufficient; no mapper framework or new package is needed.

## Out of Scope

- Migrating category, funding-source, location, or status.
- Migrating asset, circulation, or approval.
- Changing condition business rules, validation, permissions, routes, response DTOs, or database behavior.
- Adding soft-delete, domain events, generic repositories, or cross-service contracts.

## Success Criteria

- **SC-001**: Existing condition callers use all four routes without request or response changes.
- **SC-002**: Condition use cases run in isolation with a repository double and no database connection.
- **SC-003**: Static inspection finds no application-to-presentation, application-to-Prisma, domain-to-Prisma, or presentation-to-repository dependency in condition.
- **SC-004**: Condition follows the target layout and has one use case per file.
- **SC-005**: Focused condition tests and `pnpm run validate` pass.
- **SC-006**: A later maintainer can use condition or category as a direct structural template without importing internal condition paths.
