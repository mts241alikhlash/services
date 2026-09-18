# Feature Specification: Inventory Service Clean Architecture Migration

**Feature Branch**: `003-inventory-service-migration`
**Created**: 2026-09-14
**Status**: Implemented; final verification recorded 2026-09-16
**Input**: Migrate the complete `inventory-service` to the documented Clean Architecture and bounded-module structure while preserving public behavior and removing internal table-ownership violations.

## Context

`inventory-service` already owns its database and has no external source dependency. Its remaining migration work is inside the service: eight business modules use mixed flat and layered structures, many use cases name HTTP DTOs, and several repositories query or mutate tables owned by another inventory module. `reference-data/category` and `reference-data/condition` demonstrate the target layering pattern.

This feature is a service-wide migration program. It is executed incrementally through Speckit tasks and Superpowers implementation reviews. It does not mean one giant source diff.

## User Scenarios & Testing

### User Story 1 - Preserve Inventory API Behavior (Priority: P1)

As an inventory user, I need existing asset, reference-data, circulation, and approval routes to keep their current behavior while internal structure changes, so web clients and operational workflows do not break.

**Independent Test**: Compare every existing route's method, path, permission, validation, response envelope, status code, search/order behavior, not-found behavior, and failure behavior before and after each migration wave.

**Acceptance Scenarios**:

1. **Given** an authorized caller, **When** they use any existing inventory route, **Then** route path, permission requirement, validation, response shape, and status code remain unchanged.
2. **Given** a caller without the required permission, **When** they call a protected route, **Then** authorization behavior remains unchanged and no role-name bypass is added.
3. **Given** a caller sends invalid body, path, query, or UUID data, **When** the request reaches the relevant route, **Then** existing validation and HTTP error behavior remain unchanged.
4. **Given** existing asset, unit, loan, history, reference-data, workflow, and approval records, **When** list, detail, create, update, delete, loan, return, or approval operations run, **Then** current observable behavior remains unchanged unless a separate ownership task explicitly defines the equivalent behavior.
5. **Given** identity-service is unavailable, **When** an authenticated request needs identity resolution, **Then** inventory fails closed using the existing `503` behavior.

### User Story 2 - Layer Every Business Module (Priority: P1)

As a maintainer, I need each inventory module to follow the target dependency flow, so business operations can be tested without Prisma and persistence or HTTP details can change locally.

**Independent Test**: Static import checks, module provider tests, and isolated use-case tests prove that every business module follows `presentation -> application -> domain` and `infrastructure -> domain`.

**Acceptance Scenarios**:

1. **Given** any migrated module, **When** its source imports are inspected, **Then** domain imports no outer layer, application imports no HTTP DTO or Prisma, presentation imports application rather than repositories, and Prisma appears only in infrastructure persistence.
2. **Given** any repository port, **When** its input/output declarations are inspected, **Then** plain types live beside the abstract port and no Prisma type, DTO, or entity-wide `Partial` write surface leaks through it.
3. **Given** any structured use-case input, **When** its type is inspected, **Then** it is a plain application input without validation or Swagger decorators.
4. **Given** any module provider graph, **When** Nest resolves its repository token, **Then** the abstract port resolves to the Prisma adapter without use cases injecting a concrete adapter.
5. **Given** a migrated module, **When** its test suite runs, **Then** use-case tests do not require a database connection or application boot.

### User Story 3 - Enforce Table Ownership (Priority: P1)

As a maintainer, I need repositories to access only their module's tables, so one module cannot silently mutate another module's data through the shared Prisma client.

**Independent Test**: An ownership matrix and static repository scan identify every Prisma model access; each access is either owned by the repository module or replaced by an injected public port.

**Acceptance Scenarios**:

1. **Given** the 15 inventory models, **When** ownership is mapped, **Then** every model has exactly one owning module.
2. **Given** an asset repository, **When** it needs category, funding source, condition, status, or location information, **Then** it uses an injected module port rather than querying those Prisma models directly.
3. **Given** a circulation repository, **When** it needs status, transaction type, or asset-unit information, **Then** it uses public ports or an explicit application orchestration boundary rather than cross-module Prisma access.
4. **Given** an approval repository, **When** it processes workflow state, **Then** it reads and writes only workflow, approval instance, and approval log models.
5. **Given** a multi-module business operation, **When** it requires writes in more than one module, **Then** it uses direct awaited module ports and local transactions, not a transaction spanning module-owned tables.

### User Story 4 - Make Cross-Module Approval Repairable (Priority: P1)

As an approval operator, I need approval actions to preserve current outcomes while exposing and repairing partial cross-module state, so a failure cannot silently leave a loan or asset unit inconsistent.

**Independent Test**: Characterization tests cover approve, reject, next-step, final-step, missing workflow, role mismatch, duplicate/retry, and downstream failure cases before the approval boundary is changed; post-migration tests prove equivalent outcomes and visible repair state.

**Acceptance Scenarios**:

1. **Given** an approval instance at an active step, **When** an authorized approver approves or rejects it, **Then** workflow state and approval log behavior remain equivalent to the current contract.
2. **Given** an approval action that updates circulation or asset state, **When** a downstream operation fails, **Then** the half-finished state is visible and the operation can be retried or repaired without an invisible shared transaction.
3. **Given** a repeated approval request with the same natural identity, **When** it is retried, **Then** idempotency is checked before uniqueness and duplicate side effects are avoided.
4. **Given** a caller with a role not named by the active workflow step, **When** they approve, **Then** the action is rejected; only the existing centralized `SUPER_ADMIN` guard bypass remains.
5. **Given** pending approvals for several role codes, **When** the list is requested, **Then** filtering happens in repository queries and returned records preserve current visibility rules.

### User Story 5 - Establish Repeatable Migration Gates (Priority: P2)

As a maintainer, I need each migration slice to have characterization tests, focused tests, static checks, and full validation, so service-wide progress is measurable and reversible.

**Independent Test**: Every migration task names its files, dependency edges, focused test command, full validation command, and completion evidence.

**Acceptance Scenarios**:

1. **Given** a module migration task, **When** it is executed, **Then** the task has a red/green test sequence, scoped review, and no unrelated source change.
2. **Given** the full migration program, **When** all tasks finish, **Then** `pnpm run validate` passes and no old-layout imports or cross-owner Prisma accesses remain.
3. **Given** a failed migration task, **When** the task is reverted or fixed, **Then** the previous public contract remains recoverable because behavior changes are not bundled with structure changes.

## Functional Requirements

- **FR-001**: Preserve all existing inventory endpoints, HTTP methods, route parameters, permission codes, validation behavior, global response envelope, success statuses, and error statuses unless an acceptance scenario explicitly defines an equivalent boundary repair.
- **FR-002**: Preserve current search, filtering, ordering, pagination, period scoping, soft-delete, and not-found semantics while moving code.
- **FR-003**: Migrate all currently flat business modules to the target layout: `reference-data/funding-source`, `reference-data/location`, `reference-data/status`, `asset`, `circulation`, and `approval`; keep already-migrated `category` and `condition` as reference patterns.
- **FR-004**: Keep the dependency flow `presentation -> application -> domain` and `infrastructure -> domain` in every business module.
- **FR-005**: Ensure domain and application layers contain no Prisma imports, `PrismaService`, HTTP DTO imports, controller imports, or concrete infrastructure dependencies.
- **FR-006**: Ensure each repository port declares plain input/output types beside its abstract port; update inputs must use explicit fields rather than `Partial` of a create/entity type.
- **FR-007**: Ensure every structured use case has a plain application input type in its use-case folder and maps input fields explicitly to repository inputs.
- **FR-008**: Ensure every use case has one file and every new characterization or seam test follows existing test conventions without deleting existing behavior coverage.
- **FR-009**: Assign exactly one owner to each model: reference-data lookup models to their lookup module, asset models to asset, circulation models to circulation, and approval models to approval.
- **FR-010**: Remove cross-owner Prisma reads and writes from asset, circulation, and approval repositories; replace them with injected public module ports or explicit application orchestration.
- **FR-011**: Keep local Prisma transactions only within one module's owned writes; do not wrap cross-module writes in a shared transaction.
- **FR-012**: Model approval actions that cross module boundaries as visible, retryable local steps with explicit idempotency and failure handling.
- **FR-013**: Keep authorization permission-based and preserve the single `SUPER_ADMIN` bypass in `PermissionGuard`; no controller, use case, or repository may compare role names/codes as an authorization bypass.
- **FR-014**: Ensure every soft-deletable query filters `deletedAt: null`, every period-bound query scopes by its period key, and no query filters records in memory after a wide read.
- **FR-015**: Add tests for all five circulation use cases before moving their files, because the current module has no use-case specs.
- **FR-016**: Add tests for asset and approval seams needed to preserve current behavior and prove ownership boundaries; do not add tests that merely assert mocks without behavior.
- **FR-017**: Do not add runtime dependencies, services, database tables, migrations, domain events, generic base repositories, or unrelated API changes.
- **FR-018**: Keep each implementation slice scoped to one module or one explicitly named boundary concern, with focused review before the next slice.
- **FR-019**: Every slice MUST pass the relevant focused tests, typecheck, lint, strict lint, and ultimately `pnpm run validate`.
- **FR-020**: Update `docs/ARCHITECTURE.md` and the service profile only when measured migration state or ownership facts change; keep one source of truth for the documented procedure.

## Key Entities and Ownership

| Module | Owned models |
|---|---|
| `reference-data/category` | `InventoryCategory` |
| `reference-data/condition` | `InventoryCondition` |
| `reference-data/location` | `InventoryLocation` |
| `reference-data/funding-source` | `InventoryFundingSource` |
| `reference-data/status` | `InventoryStatus` |
| `asset` | `InventoryAsset`, `InventoryAssetUnit` |
| `circulation` | `InventoryLoan`, `InventoryLoanItem`, `InventoryHistory`, `InventoryTransactionType` |
| `approval` | `ApprovalWorkflow`, `ApprovalStep`, `ApprovalInstance`, `ApprovalLog` |

## Assumptions

- `category` and `condition` are completed structural references and are not re-migrated unless a verification task finds a direct violation.
- Existing routes are authoritative; this program does not redesign public HTTP contracts.
- `asset`, `circulation`, and `approval` remain modules in this service, not new services.
- Cross-module access remains in-process through public Nest module ports; no event bus or network hop is introduced.
- Existing database schema and migration history remain unchanged unless an ownership task proves a schema correction is required and separately specifies it.
- Approval downstream operations may require a small explicit orchestration interface or state record; the exact smallest shape is selected in planning after characterization tests expose current outcomes.
- Inventory's database is already service-owned and complete, so no service-boundary or migration-script redesign is part of this feature.

## Out of Scope

- Splitting inventory into multiple deployable services.
- Changing the public inventory API, permission vocabulary, or response envelope.
- Adding an event broker, distributed transaction coordinator, workflow platform, or generic framework.
- Redesigning asset depreciation arithmetic or unrelated business policy.
- Frontend changes in `inventory-web`.
- Database migration changes without a separately approved data-impact plan.

## Success Criteria

- **SC-001**: All existing inventory routes retain their current externally observable contract after each migration wave.
- **SC-002**: All eight business modules use the target four-layer layout, with `category` and `condition` as completed references.
- **SC-003**: Static inspection finds zero application-to-DTO, application-to-Prisma, domain-to-Prisma, controller-to-Prisma, and cross-owner repository Prisma accesses.
- **SC-004**: Every repository port has explicit plain input/output contracts and every structured use case has a plain application input.
- **SC-005**: Every circulation use case has characterization coverage before its structural move; asset and approval critical paths have equivalent coverage.
- **SC-006**: Approval cross-module failures are visible, retryable, idempotent, and not hidden inside a shared transaction.
- **SC-007**: `pnpm run validate` passes at final program completion.
- **SC-008**: `docs/ARCHITECTURE.md` records final module status, ownership, migration order, and verification evidence without stale baseline claims.
