# Research: Inventory Service Migration

## Decision 1: Treat migration as a program of narrow slices

- **Decision**: Use one Speckit master plan with ordered task waves. Implement each slice through Superpowers TDD, scoped review, and validation.
- **Rationale**: The service contains eight business modules and two high-risk cross-module workflows. One giant refactor would mix structural and behavioral changes and make rollback unclear.
- **Alternatives considered**: One-shot service rewrite is faster to start but impossible to review safely. Module-only plans duplicate global ownership and completion rules.

## Decision 2: Preserve behavior before changing semantics

- **Decision**: Characterize current routes and business operations first. Separate behavior fixes from structural moves.
- **Rationale**: Existing defects include missing soft-delete filters, in-memory filtering, N+1 queries, and approval role behavior. Silent fixes during a move would make regressions ambiguous.
- **Alternatives considered**: Fixing every discovered defect during layering would create a broad behavior release with weak attribution.

## Decision 3: Use explicit module ownership

- **Decision**: Reference-data modules own their lookup models; asset owns assets and units; circulation owns loans, loan items, histories, and transaction types; approval owns workflow and approval records.
- **Rationale**: The Prisma schema already gives clear model clusters, and the constitution requires one repository to query only its own models.
- **Alternatives considered**: Letting approval own the whole approval consequence transaction preserves current code but violates table ownership and prevents module replacement.

## Decision 4: Replace cross-module Prisma access with public ports

- **Decision**: Inject narrow ports from the owning module. Keep module classes and cross-module DTOs imported directly, not through barrels, where NodeNext ESM rules require it.
- **Rationale**: This is the established service convention and prevents repository internals from becoming hidden APIs.
- **Alternatives considered**: Shared Prisma helpers would hide ownership violations rather than remove them. New HTTP services would add latency and failure modes without a service boundary need.

## Decision 5: Treat approval consequences as orchestration, not a repository transaction

- **Decision**: Characterize approval first, then move workflow persistence into approval and downstream asset/circulation changes behind awaited ports with visible retry/repair state.
- **Rationale**: A repository transaction currently writes approval, loan, loan item, unit, and history data. The constitution forbids shared cross-module transactions and requires repairable non-atomic sequences.
- **Alternatives considered**: Keeping one Prisma transaction is atomic but violates ownership. Events would hide failed consequences and are explicitly not used in this service.

## Decision 6: Use existing dependencies and commands

- **Decision**: No new package. Use existing NestJS DI, Prisma, class-validator, Jest, static repository searches, and `pnpm run validate`.
- **Rationale**: The service already has all required runtime and test tooling.
- **Alternatives considered**: Dependency-cruiser, generated clients, event libraries, and workflow packages add setup and maintenance without a current need.

## Baseline Source Path Inventory

Inventory captured from `inventory-service/src/inventory/` on 2026-09-14.
Paths in this section are preserved as baseline evidence.

### Use Cases

| Module                          | Current use-case paths                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reference-data/category`       | `src/inventory/reference-data/category/application/use-cases/create-category/create-category.use-case.ts`; `src/inventory/reference-data/category/application/use-cases/delete-category/delete-category.use-case.ts`; `src/inventory/reference-data/category/application/use-cases/get-categories/get-categories.use-case.ts`; `src/inventory/reference-data/category/application/use-cases/update-category/update-category.use-case.ts`                                                                                                |
| `reference-data/condition`      | `src/inventory/reference-data/condition/application/use-cases/create-condition/create-condition.use-case.ts`; `src/inventory/reference-data/condition/application/use-cases/delete-condition/delete-condition.use-case.ts`; `src/inventory/reference-data/condition/application/use-cases/get-conditions/get-conditions.use-case.ts`; `src/inventory/reference-data/condition/application/use-cases/update-condition/update-condition.use-case.ts`                                                                                      |
| `reference-data/funding-source` | `src/inventory/reference-data/funding-source/use-cases/create-funding-source.use-case.ts`; `src/inventory/reference-data/funding-source/use-cases/delete-funding-source.use-case.ts`; `src/inventory/reference-data/funding-source/use-cases/get-funding-sources.use-case.ts`; `src/inventory/reference-data/funding-source/use-cases/update-funding-source.use-case.ts`                                                                                                                                                                |
| `reference-data/location`       | `src/inventory/reference-data/location/use-cases/create-location.use-case.ts`; `src/inventory/reference-data/location/use-cases/delete-location.use-case.ts`; `src/inventory/reference-data/location/use-cases/get-locations.use-case.ts`; `src/inventory/reference-data/location/use-cases/update-location.use-case.ts`                                                                                                                                                                                                                |
| `reference-data/status`         | `src/inventory/reference-data/status/use-cases/create-status.use-case.ts`; `src/inventory/reference-data/status/use-cases/delete-status.use-case.ts`; `src/inventory/reference-data/status/use-cases/get-statuses.use-case.ts`; `src/inventory/reference-data/status/use-cases/update-status.use-case.ts`                                                                                                                                                                                                                               |
| `reference-data`                | `src/inventory/reference-data/use-cases/get-metadata.use-case.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `asset`                         | `src/inventory/asset/use-cases/add-units.use-case.ts`; `src/inventory/asset/use-cases/create-asset.use-case.ts`; `src/inventory/asset/use-cases/delete-asset.use-case.ts`; `src/inventory/asset/use-cases/delete-unit.use-case.ts`; `src/inventory/asset/use-cases/get-asset-by-id.use-case.ts`; `src/inventory/asset/use-cases/get-asset-units.use-case.ts`; `src/inventory/asset/use-cases/get-assets.use-case.ts`; `src/inventory/asset/use-cases/update-asset.use-case.ts`; `src/inventory/asset/use-cases/update-unit.use-case.ts` |
| `circulation`                   | `src/inventory/circulation/use-cases/create-loan.use-case.ts`; `src/inventory/circulation/use-cases/get-histories.use-case.ts`; `src/inventory/circulation/use-cases/get-loan-by-id.use-case.ts`; `src/inventory/circulation/use-cases/get-loans.use-case.ts`; `src/inventory/circulation/use-cases/return-loan.use-case.ts`                                                                                                                                                                                                            |
| `approval`                      | `src/inventory/approval/use-cases/create-workflow.use-case.ts`; `src/inventory/approval/use-cases/get-pending-approvals.use-case.ts`; `src/inventory/approval/use-cases/get-workflow-by-id.use-case.ts`; `src/inventory/approval/use-cases/get-workflows.use-case.ts`; `src/inventory/approval/use-cases/process-approval.use-case.ts`                                                                                                                                                                                                  |

Baseline use-case count: 40 production files. `asset`, `circulation`, and
`approval` use cases imported request DTOs directly; category and condition
already used structured application input files for create/update.

### Controllers

`src/inventory/reference-data/presentation/metadata.controller.ts`;
`src/inventory/reference-data/category/presentation/http/category.controller.ts`;
`src/inventory/reference-data/condition/presentation/http/condition.controller.ts`;
`src/inventory/reference-data/funding-source/presentation/funding-source.controller.ts`;
`src/inventory/reference-data/location/presentation/location.controller.ts`;
`src/inventory/reference-data/status/presentation/status.controller.ts`;
`src/inventory/asset/presentation/asset.controller.ts`;
`src/inventory/asset/presentation/asset-unit.controller.ts`;
`src/inventory/circulation/presentation/loan.controller.ts`;
`src/inventory/circulation/presentation/history.controller.ts`;
`src/inventory/approval/presentation/workflow.controller.ts`;
`src/inventory/approval/presentation/approval.controller.ts`.

Baseline controller count: 12.

### Repositories and Persistence Includes

Repositories:

- `src/inventory/reference-data/category/infrastructure/persistence/prisma/prisma-category.repository.ts`
- `src/inventory/reference-data/condition/infrastructure/persistence/prisma/prisma-condition.repository.ts`
- `src/inventory/reference-data/funding-source/infrastructure/persistence/prisma-funding-source.repository.ts`
- `src/inventory/reference-data/location/infrastructure/persistence/prisma-location.repository.ts`
- `src/inventory/reference-data/status/infrastructure/persistence/prisma-status.repository.ts`
- `src/inventory/asset/infrastructure/persistence/prisma-asset.repository.ts`
- `src/inventory/asset/infrastructure/persistence/prisma-asset-unit.repository.ts`
- `src/inventory/circulation/infrastructure/persistence/prisma-circulation.repository.ts`
- `src/inventory/approval/infrastructure/persistence/prisma-approval.repository.ts`

Persistence include/type companions:

- `src/inventory/asset/infrastructure/persistence/prisma-asset.includes.ts`
- `src/inventory/circulation/infrastructure/persistence/prisma-circulation.includes.ts`
- `src/inventory/approval/infrastructure/persistence/prisma-approval.includes.ts`

### Request and Response DTOs

Request DTO paths:

- `src/inventory/reference-data/category/presentation/http/dto/request/create-category.dto.ts`
- `src/inventory/reference-data/category/presentation/http/dto/request/update-category.dto.ts`
- `src/inventory/reference-data/condition/presentation/http/dto/request/create-condition.dto.ts`
- `src/inventory/reference-data/condition/presentation/http/dto/request/update-condition.dto.ts`
- `src/inventory/reference-data/funding-source/dto/request/create-funding-source.dto.ts`
- `src/inventory/reference-data/funding-source/dto/request/update-funding-source.dto.ts`
- `src/inventory/reference-data/location/dto/request/create-location.dto.ts`
- `src/inventory/reference-data/location/dto/request/update-location.dto.ts`
- `src/inventory/reference-data/status/dto/request/create-status.dto.ts`
- `src/inventory/reference-data/status/dto/request/update-status.dto.ts`
- `src/inventory/asset/dto/request/asset-query.dto.ts`
- `src/inventory/asset/dto/request/asset-unit-query.dto.ts`
- `src/inventory/asset/dto/request/create-asset.dto.ts`
- `src/inventory/asset/dto/request/create-units.dto.ts`
- `src/inventory/asset/dto/request/update-asset.dto.ts`
- `src/inventory/asset/dto/request/update-unit.dto.ts`
- `src/inventory/circulation/dto/request/create-loan.dto.ts`
- `src/inventory/circulation/dto/request/history-query.dto.ts`
- `src/inventory/circulation/dto/request/loan-query.dto.ts`
- `src/inventory/circulation/dto/request/return-loan.dto.ts`
- `src/inventory/approval/dto/request/approve-action.dto.ts`
- `src/inventory/approval/dto/request/create-workflow.dto.ts`

Response DTO paths:

- `src/inventory/reference-data/category/presentation/http/dto/response/category-response.dto.ts`
- `src/inventory/reference-data/condition/presentation/http/dto/response/condition-response.dto.ts`
- `src/inventory/reference-data/funding-source/dto/response/funding-source-response.dto.ts`
- `src/inventory/reference-data/location/dto/response/location-response.dto.ts`
- `src/inventory/reference-data/status/dto/response/status-response.dto.ts`
- `src/inventory/reference-data/dto/response/metadata-response.dto.ts`

Baseline DTO count: 28 files, counting `create-workflow.dto.ts` and its nested
step DTO as one file. Asset, circulation, and approval controllers have no
dedicated response DTO classes; they return repository payloads that the global
response interceptor wraps.

### Specs

- `src/app.module.boots.spec.ts`
- `src/api-response-types.spec.ts`
- `src/no-ignored-caller.spec.ts`
- `src/route-collisions.spec.ts`
- `src/route-conflicts.spec.ts`
- `src/single-role-bypass.spec.ts`
- `src/core/filters/http-exception.filter.spec.ts`
- `src/core/interceptors/response.interceptor.spec.ts`
- `src/inventory/approval/use-cases/create-workflow.use-case.spec.ts`
- `src/inventory/approval/use-cases/process-approval.use-case.spec.ts`
- `src/inventory/asset/infrastructure/persistence/prisma-asset-unit.lendable.spec.ts`
- `src/inventory/circulation/` has no use-case spec files
- `src/inventory/reference-data/category/application/use-cases/category-use-cases.spec.ts`
- `src/inventory/reference-data/category/infrastructure/persistence/prisma/prisma-category.repository.spec.ts`
- `src/inventory/reference-data/category/presentation/http/category.controller.spec.ts`
- `src/inventory/reference-data/condition/application/use-cases/condition-use-cases.spec.ts`
- `src/inventory/reference-data/condition/infrastructure/persistence/prisma/prisma-condition.repository.spec.ts`
- `src/inventory/reference-data/condition/infrastructure/persistence/prisma/condition.module.spec.ts`
- `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`
- `src/inventory/reference-data/use-cases/get-metadata.use-case.spec.ts`
- `src/inventory/shared/domain/inventory-reference-data.spec.ts`
- `src/inventory/shared/infrastructure/inventory-unit-movement.steps.spec.ts`
- `src/platform/identity/identity-response.spec.ts`
- `src/platform/identity/http-identity.adapter.spec.ts`

Baseline Jest spec count: 23 files.

## Baseline and Approval Characterization Evidence

### Create loan baseline before T073

`CreateLoanUseCase` first reads `LOAN_PENDING`, reads requested non-deleted
units, rejects missing units or units whose status disallows transactions,
generates the next daily `LN-YYYYMMDD-NNNN` number, then calls
`processCreateLoanTransaction`.

`PrismaCirculationRepository.processCreateLoanTransaction` runs one Prisma
`$transaction`:

1. Create `InventoryLoan` and nested `InventoryLoanItem` rows with pending
   status.
2. Update requested `InventoryAssetUnit` rows to pending status.
3. Find active `ApprovalWorkflow` for `targetEntity: InventoryLoan`.
4. If workflow exists, create `ApprovalInstance`, then update the loan with
   `workflowInstanceId`, and return the loan with unit items.
5. If no workflow exists, find `LOAN_APPROVED`, `LOANED`, and
   `TX-LOAN-OUT`; throw `InventoryReferenceDataMissingException` if any is
   missing; update loan to approved; update units to loaned; create one history
   row per unit; return the approved loan.

The transaction therefore writes circulation, asset, approval, and history
models in one local Prisma transaction. Any thrown error rolls back all writes.

### Return loan baseline before T073

`ReturnLoanUseCase` reads the loan, reads `LOAN_RETURNED`, `AVAILABLE`, and
`TX-LOAN-IN`, rejects missing reference data, rejects an already returned loan,
and checks every submitted unit belongs to the loan. It then calls
`processReturnLoanTransaction`.

`PrismaCirculationRepository.processReturnLoanTransaction` runs one Prisma
`$transaction`:

1. Update `InventoryLoan.actualReturnDate` to `new Date()` and set returned
   status.
2. `moveUnitsAndRecord` updates each `InventoryAssetUnit` to available,
   optionally updates returned condition, and creates one
   `InventoryHistory` row per item.
3. Return the updated loan.

The loan, asset-unit, and history writes roll back together on an exception.

### Approval actions baseline before T076

The Wave 0 baseline called `processApprovalTransaction` once for every action.
That repository transaction created the log, changed the approval instance,
and performed the loan, unit, and history consequences in one Prisma
`$transaction`. Missing reference data or any downstream failure rolled back
all writes. This paragraph records the baseline that T061-T067 preserved before
the ownership work.

### T081 approval characterization after T076 (historical snapshot)

`ProcessApprovalUseCase` first loaded the approval instance and the
`LOAN_PENDING` status. It then validates the active workflow step and requires
the exact `approverRoleCode` from that step. At this snapshot, the use case did
not perform a duplicate or idempotency check.

`PrismaApprovalRepository.processApprovalTransaction` now runs an
approval-local Prisma `$transaction`. It creates `ApprovalLog` and updates only
`ApprovalInstance`.

The snapshot outcomes were:

- **Missing instance**: throws `NotFoundException('Approval instance not found.')`.
- **Missing pending status or non-pending instance**: throws
  `BadRequestException('This approval request is no longer pending.')`.
- **Missing active step, including an instance with no workflow steps**: throws
  `BadRequestException('Current approval step sequence is invalid.')`.
- **Role mismatch**: throws
  `ForbiddenException('You do not have the required role (<approverRoleCode>) to process this step.')`; the local transaction is not called. `SUPER_ADMIN` is not a use-case bypass.
- **Forward requested without a next step**: throws
  `BadRequestException('This workflow has no further approver to forward to.')`; the local transaction is not called.
- **Approve to next step**: when a next step is mandatory or the caller sets
  `forwardToNextApprover: true`, the local transaction writes the approval log,
  advances `currentStepSequence`, and returns
  `{ success: true, action: 'APPROVE_STEP', nextStepSequence, log }`. No loan,
  unit, or history consequence runs.
- **Final approve**: when there is no next step, or an optional next step is not
  forwarded, the local transaction writes the log and sets the instance to the
  approved status. The use case then awaits loan status update, loan-item lookup,
  unit status updates to `LOANED`, and one history record per loan item. It
  returns `{ success: true, action: 'APPROVE_FINAL', log }`. Empty loan items
  skip unit and history calls.
- **Reject**: rejection never forwards. The use case resolves rejected and
  available statuses plus `TX-LOAN-CANCEL` before the local transaction. The
  transaction writes the log and sets the instance to rejected. The use case
  then awaits loan status update, loan-item lookup, unit status updates to
  `AVAILABLE`, and one cancellation history record per loan item. It returns
  `{ success: true, action: 'REJECT', log }`. Empty loan items skip unit and
  history calls.
- **Missing consequence reference data**: final approval requires
  `LOAN_APPROVED`, `LOANED`, and `TX-LOAN-OUT`; rejection requires
  `LOAN_REJECTED`, `AVAILABLE`, and `TX-LOAN-CANCEL`. Missing values raise
  `InventoryReferenceDataMissingException` before approval-local persistence.
- **Local persistence failure**: an error from the approval-local transaction
  propagates and no approval log or instance update commits.
- **Post-commit consequence failure**: an error from loan update, loan-item
  lookup, unit mutation, or history recording propagated after approval-local
  persistence had committed. The snapshot use case recorded no failure or repair
  state and exposed no retry-specific result.

At this snapshot, repeated requests had no explicit natural-identity or
idempotency handling.
After final approval or rejection, the next request sees a non-pending instance
and gets the not-pending error. After an intermediate approval, the instance is
still pending at the next step, so a repeated request is evaluated as a new
action against that step. `ApprovalLog` has no composite uniqueness constraint
that prevents repeated action rows.

The characterization spec covers the approve-next, final-approve, reject,
role-mismatch, missing-instance, missing-pending-status, invalid-step, and
forwarding outcomes. Its transaction-failure test rejects the local approval
transaction; it does not execute a post-commit downstream failure. Dedicated
idempotency and repair-state tests remain assigned to T085, T086, and T089.

Pending approval role filtering now sends pending status and requested role codes
to the Prisma predicate, then retains the active-step in-memory check. Loan
details are now loaded through one deduplicated bulk circulation capability call;
that change is recorded in the current source state below.

### Workflow creation

`createWorkflow` runs one approval-local Prisma `$transaction`: deactivate
existing active workflows for the same target entity, then create the workflow
and nested steps. This transaction writes only `ApprovalWorkflow` and
`ApprovalStep` models.

## Current Source State

Reviewed on 2026-09-16 after T001-T103 implementation and final cleanup.

- All eight business modules use layered application, domain, infrastructure,
  and HTTP presentation paths. The reference-data aggregate's metadata
  composition remains at `src/inventory/reference-data/use-cases/` and
  `src/inventory/reference-data/presentation/` because it is not one of the five
  lookup modules.
- All structured use cases use plain application input types. No application or
  domain production file imports request DTOs, Prisma, or `PrismaService`.
- Prisma adapters and include/type companions live under each module's
  `infrastructure/persistence/prisma/` path.
- All 15 models have one owner. Foreign projections and validation cross public
  capability ports; local transactions contain only owned writes.
- Pending approvals filter role codes in the Prisma predicate and load unique
  loan IDs through one bulk circulation capability call. Response order follows
  approval-instance order.
- Approval consequences use approval-local persistence plus awaited asset and
  circulation calls. Final approval and rejection have visible `PENDING`,
  `COMPLETED`, and `FAILED` state, lease-safe retry, and keyed history writes.
- Current full validation evidence is in `quickstart.md`: 71 suites and 407
  tests passed.
