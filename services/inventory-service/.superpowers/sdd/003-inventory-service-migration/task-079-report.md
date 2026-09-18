# T079 Report

This report records the 2026-09-15 ownership snapshot. Its residual findings
were superseded by the final 2026-09-16 review recorded in
`specs/003-inventory-service-migration/data-model.md`.

## Scope

Reviewed every production Prisma adapter, Prisma include definition, and shared
movement helper under `src/inventory/`. Reviewed `prisma/inventory.prisma` for
the ownership source of truth, `docs/OVERVIEW.md`, `docs/ARCHITECTURE.md`,
`docs/CONSTITUTION.md`, `tasks.md`, `data-model.md`, and T078 evidence.

T068-T078 evidence was present under
`.superpowers/sdd/003-inventory-service-migration/` and was read. No source,
schema, package, task, or other planning file changed for the initial review;
the scoped T070 follow-up then changed the asset-unit adapter and focused test.

## Method

Static scans covered:

- Every Prisma model delegate reference under `src/inventory/`.
- Every Prisma include/select relation in adapter and include files.
- Every create, createMany, update, updateMany, delete, and transaction call.
- Every `PrismaService`, `TransactionClient`, `$transaction`, and shared movement
  helper reference.
- The 15 model declarations in `prisma/inventory.prisma`.

Specs were excluded from classification because their Prisma objects are test
doubles or source assertions, not runtime access. The scoped T070 follow-up
added focused runtime evidence for capability-port calls.

## Ownership Result

| Owner | Models | Model count |
|---|---|---:|
| `asset` | `InventoryAsset`, `InventoryAssetUnit` | 2 |
| `reference-data/category` | `InventoryCategory` | 1 |
| `reference-data/location` | `InventoryLocation` | 1 |
| `reference-data/condition` | `InventoryCondition` | 1 |
| `reference-data/status` | `InventoryStatus` | 1 |
| `reference-data/funding-source` | `InventoryFundingSource` | 1 |
| `circulation` | `InventoryHistory`, `InventoryTransactionType`, `InventoryLoan`, `InventoryLoanItem` | 4 |
| `approval` | `ApprovalWorkflow`, `ApprovalStep`, `ApprovalInstance`, `ApprovalLog` | 4 |
| **Total** | **all schema models** | **15** |

Result: **15/15 models have exactly one owner.** No duplicate ownership found.

## Access Classification

### Owner-local access

- Reference-data adapters read and write only their own model delegates.
- Asset adapters directly read and write `InventoryAsset` and
  `InventoryAssetUnit`, including asset-owned nested unit creation and unit
  mutation. Asset-unit `findByIds` uses only public asset/status capabilities;
  normal `findAll` still carries deferred asset-name relation search/order and
  status relation filtering.
- Circulation directly reads and writes `InventoryLoan`, `InventoryLoanItem`,
  `InventoryHistory`, and `InventoryTransactionType`.
- Approval directly reads and writes `ApprovalWorkflow`, `ApprovalStep`,
  `ApprovalInstance`, and `ApprovalLog`.
- Approval transactions contain workflow, instance, and log writes only.
- Circulation transaction contains loan and loan-item writes only.
- Shared movement helper contains capability calls, not Prisma access.

### Remaining cross-owner access in the 2026-09-15 snapshot

| Location | Foreign models | Access | Classification |
|---|---|---|---|
| `src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.includes.ts:3-16` | `InventoryAsset`, `InventoryAssetUnit`, `InventoryLocation`, `InventoryStatus`, `InventoryCondition` | nested relation reads from loan projections | deferred violation: circulation repository reads asset-owned and reference-owned data directly |
| `src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.repository.ts:140-155` | `InventoryAsset`, `InventoryStatus` | asset-name relation search/order and status relation predicate in `findAll` | deferred ownership residue; `findByIds` does not use these predicates or ordering |
| `src/inventory/asset/infrastructure/persistence/prisma/prisma-asset.repository.ts:287-299` | `InventoryCategory`, `InventoryFundingSource`, `InventoryCondition`, `InventoryStatus`, `InventoryLocation` | relation `connect` during asset/unit creation | deferred relation-write coupling; foreign rows are not mutated, but Prisma relation operations remain in asset adapter |
| `src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.repository.ts:274-279` | `InventoryCondition`, `InventoryStatus`, `InventoryLocation` | relation `connect` during unit update | deferred relation-write coupling; foreign rows are not mutated |

No remaining direct foreign model delegate calls were found in production
repositories. The snapshot classified relation predicates/order, projections,
and relation connects as residual findings under a strict relation rule. Later
ownership work and final review superseded that classification. Same-owner asset
and asset-unit relations remain inside the `asset` boundary; foreign references
use public capability ports and scalar IDs.

## Evidence Update

`specs/003-inventory-service-migration/data-model.md` now contains:

- Final model-by-owner read/write matrix.
- 15/15 ownership result.
- Direct delegate and transaction evidence.
- Exact remaining cross-owner locations and classification.
- T068-T078 evidence references.

## Final Status at snapshot

- Ownership matrix: **PASS**.
- One owner per model: **PASS, 15/15**.
- Cross-owner Prisma access: **FAIL in the 2026-09-15 snapshot**.
- Cross-owner transaction writes: **PASS, none found in production adapters**.
- Scope compliance: **PASS for the review itself**. This follow-up changed the
  asset-unit adapter, its focused test, `data-model.md`, and T070/T079 reports;
  circulation and approval projections were not redesigned.
- T079 execution: **COMPLETE as a historical evidence task**. Final state is
  recorded in `data-model.md` current access evidence.

## Final Reconciliation: 2026-09-16

- Ownership matrix: **PASS, 15/15**.
- Cross-owner Prisma access: **PASS** after later circulation, approval, and
  relation-write cleanup.
- Same-owner `asset` to `asset-unit` relation predicates, ordering, and
  projections are allowed and remain in the asset adapter.
- Fresh full validation: **PASS, 71 suites / 407 tests**.
