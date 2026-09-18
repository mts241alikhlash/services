# Data Model: Inventory Service Migration

Migration changes code ownership boundaries, not database columns. The Prisma
schema contains exactly 15 inventory models. Baseline access was captured from
`inventory-service/src/inventory/` on 2026-09-14. Current access evidence at the
end of this document supersedes the baseline and historical T079 snapshot.

## Baseline Ownership Matrix (2026-09-14)

| Model                      | Table                         | Owner                           | Baseline direct access                                                                              | Baseline risk or note                                                                                                                    |
| -------------------------- | ----------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `InventoryAsset`           | `inventory_assets`            | `asset`                         | asset repository; circulation loan projections; approval loan-detail projection                     | circulation and approval read it through foreign loan/unit projections                                                                   |
| `InventoryAssetUnit`       | `inventory_asset_units`       | `asset`                         | asset-unit repository; asset repository count; circulation `findUnitsByIds`; shared movement helper | asset-unit capability hydration uses public asset/status ports; circulation and approval transactions update units through shared helper |
| `InventoryCategory`        | `inventory_categories`        | `reference-data/category`       | asset repository lookup and asset includes                                                          | asset reads category directly; narrow category projection is required                                                                    |
| `InventoryLocation`        | `inventory_locations`         | `reference-data/location`       | asset-unit repository; asset and circulation includes                                               | foreign lookup data is embedded in asset/circulation projections                                                                         |
| `InventoryCondition`       | `inventory_conditions`        | `reference-data/condition`      | asset-unit repository; asset and circulation includes                                               | foreign lookup data is embedded in asset/circulation projections                                                                         |
| `InventoryStatus`          | `inventory_statuses`          | `reference-data/status`         | asset-unit repository; circulation; approval                                                        | circulation and approval use status keys directly                                                                                        |
| `InventoryFundingSource`   | `inventory_funding_sources`   | `reference-data/funding-source` | asset includes and asset repository relation writes                                                 | asset connects funding source directly                                                                                                   |
| `InventoryHistory`         | `inventory_histories`         | `circulation`                   | circulation repository; shared movement helper                                                      | shared helper, circulation, and approval currently write/read it                                                                         |
| `InventoryTransactionType` | `inventory_transaction_types` | `circulation`                   | circulation and approval                                                                            | approval looks up transaction types directly                                                                                             |
| `InventoryLoan`            | `inventory_loans`             | `circulation`                   | circulation and approval                                                                            | approval updates loans directly                                                                                                          |
| `InventoryLoanItem`        | `inventory_loan_items`        | `circulation`                   | circulation relation writes; approval reads                                                         | approval reads loan items to move units                                                                                                  |
| `ApprovalWorkflow`         | `approval_workflows`          | `approval`                      | approval; circulation active-workflow lookup                                                        | circulation creates loan approval state through approval tables                                                                          |
| `ApprovalStep`             | `approval_steps`              | `approval`                      | approval workflow includes                                                                          | workflow definition owned by approval                                                                                                    |
| `ApprovalInstance`         | `approval_instances`          | `approval`                      | approval; circulation approval-instance create                                                      | circulation creates an approval instance inside loan transaction                                                                         |
| `ApprovalLog`              | `approval_logs`               | `approval`                      | approval                                                                                            | approval action log is approval-owned                                                                                                    |

Every model has one owner. Foreign keys remain database relationships, but
repositories must stop querying or mutating foreign-owner models directly.

## Baseline Prisma Access Evidence (2026-09-14)

| Module                          | Direct Prisma model access in current repositories/helpers                                                                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reference-data/category`       | `inventoryCategory`                                                                                                                                                                                                  |
| `reference-data/condition`      | `inventoryCondition`                                                                                                                                                                                                 |
| `reference-data/funding-source` | `inventoryFundingSource`                                                                                                                                                                                             |
| `reference-data/location`       | `inventoryLocation`                                                                                                                                                                                                  |
| `reference-data/status`         | `inventoryStatus`                                                                                                                                                                                                    |
| `asset`                         | `inventoryAsset`, `inventoryAssetUnit`, `inventoryCategory`                                                                                                                                                          |
| `circulation`                   | `inventoryLoan`, `inventoryHistory`, `inventoryStatus`, `inventoryTransactionType`, `inventoryAssetUnit`, `approvalWorkflow`, `approvalInstance`                                                                     |
| `approval`                      | `approvalWorkflow`, `approvalInstance`, `approvalLog`, `inventoryStatus`, `inventoryTransactionType`, `inventoryLoan`, `inventoryLoanItem`, plus shared helper access to `inventoryAssetUnit` and `inventoryHistory` |
| `shared`                        | `inventoryAssetUnit`, `inventoryHistory` through `inventory-unit-movement.steps.ts`                                                                                                                                  |

The access list includes relation projections, not only standalone reads. Exact
foreign-owner findings at baseline:

- `asset/infrastructure/persistence/prisma-asset.repository.ts` calls
  `inventoryCategory.findUnique` and its include reads category and funding
  source.
- `circulation/infrastructure/persistence/prisma-circulation.repository.ts`
  reads `inventoryStatus`, `inventoryTransactionType`, and
  `inventoryAssetUnit`; its create-loan transaction reads and creates
  `approvalWorkflow` and `approvalInstance`, and writes asset units and
  histories through `moveUnitsAndRecord`.
- `approval/infrastructure/persistence/prisma-approval.repository.ts` reads
  `inventoryStatus`, `inventoryTransactionType`, `inventoryLoan`, and
  `inventoryLoanItem`; approval transactions write loans and use
  `moveUnitsAndRecord` for asset units and histories.
- `shared/infrastructure/inventory-unit-movement.steps.ts` accepts a Prisma
  `TransactionClient` and writes both `inventoryAssetUnit` and
  `inventoryHistory`.

## T079 Access Evidence (2026-09-15 Snapshot)

Review date: 2026-09-15. This section is a historical snapshot captured before
the final ownership cleanup. Scope: every production `*.ts` file under
`src/inventory/`, including Prisma adapter include definitions and the shared
movement helper. Test doubles and source strings inside specs were excluded from
the ownership result. T068-T078 evidence was reviewed from
`.superpowers/sdd/003-inventory-service-migration/task-068-report.md` through
`task-078-report.md`.

### Model Access By Owner

| Model                      | Owner                           | Reads in `src/inventory/`                                                                               | Writes in `src/inventory/`                                                                              | Result                                                                                                                                                                                          |
| -------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `InventoryAsset`           | `asset`                         | `PrismaAssetRepository` root reads; asset-unit and circulation relation projections                     | `PrismaAssetRepository` create/update/soft-delete                                                       | owner access plus deferred foreign projections                                                                                                                                                  |
| `InventoryAssetUnit`       | `asset`                         | `PrismaAssetRepository` count; `PrismaAssetUnitRepository` root reads; circulation relation projections | `PrismaAssetRepository` nested unit create; `PrismaAssetUnitRepository` create/update/delete/updateMany | owner access; `findByIds` capability hydration uses only public asset/status ports; `findAll` asset-name/status relation predicates and ordering, plus circulation projections, remain deferred |
| `InventoryCategory`        | `reference-data/category`       | `PrismaCategoryRepository`                                                                              | asset relation connect from `PrismaAssetRepository`                                                     | owner delegate; relation connect remains                                                                                                                                                        |
| `InventoryLocation`        | `reference-data/location`       | `PrismaLocationRepository`; asset-unit and circulation relation projections                             | asset-unit relation connect from `PrismaAssetUnitRepository`                                            | owner delegate; deferred foreign projections                                                                                                                                                    |
| `InventoryCondition`       | `reference-data/condition`      | `PrismaConditionRepository`; asset-unit and circulation relation projections                            | asset and asset-unit relation connect from asset repositories                                           | owner delegate; deferred foreign projections                                                                                                                                                    |
| `InventoryStatus`          | `reference-data/status`         | `PrismaStatusRepository`; asset-unit and circulation relation projections                               | asset and asset-unit relation connect from asset repositories                                           | owner delegate; deferred foreign projections                                                                                                                                                    |
| `InventoryFundingSource`   | `reference-data/funding-source` | `PrismaFundingSourceRepository`                                                                         | asset relation connect from `PrismaAssetRepository`                                                     | owner delegate; relation connect remains                                                                                                                                                        |
| `InventoryHistory`         | `circulation`                   | `PrismaCirculationRepository`; shared helper no longer touches Prisma                                   | `PrismaCirculationRepository` create                                                                    | owner-only production access                                                                                                                                                                    |
| `InventoryTransactionType` | `circulation`                   | `PrismaCirculationRepository` lookup by code; circulation relation projection                           | no production write under `src/inventory/`                                                              | owner-only production access                                                                                                                                                                    |
| `InventoryLoan`            | `circulation`                   | `PrismaCirculationRepository` root reads                                                                | `PrismaCirculationRepository` create/update, including local transaction                                | owner-only production access                                                                                                                                                                    |
| `InventoryLoanItem`        | `circulation`                   | `PrismaCirculationRepository` root reads and loan relation projection                                   | `PrismaCirculationRepository` nested create during loan creation                                        | owner-only production access                                                                                                                                                                    |
| `ApprovalWorkflow`         | `approval`                      | `PrismaApprovalRepository` root reads and instance relation projection                                  | `PrismaApprovalRepository` local transaction updateMany/create                                          | owner-only production access                                                                                                                                                                    |
| `ApprovalStep`             | `approval`                      | `PrismaApprovalRepository` workflow relation projections                                                | `PrismaApprovalRepository` nested create under workflow                                                 | owner-only production access                                                                                                                                                                    |
| `ApprovalInstance`         | `approval`                      | `PrismaApprovalRepository` root reads                                                                   | `PrismaApprovalRepository` create/update, including local transaction                                   | owner-only production access                                                                                                                                                                    |
| `ApprovalLog`              | `approval`                      | approval relation projection                                                                            | `PrismaApprovalRepository` create, including local transaction                                          | owner-only production access                                                                                                                                                                    |

### Scan Findings

- **15/15 models have one owner.** No model is assigned to more than one module.
- **Direct delegate access is owner-local.** Reference-data adapters access only
  their own delegate. Asset adapters use `inventoryAsset` and
  `inventoryAssetUnit`; circulation uses `inventoryLoan`, `inventoryLoanItem`,
  `inventoryHistory`, and `inventoryTransactionType`; approval uses only
  `approvalWorkflow`, `approvalInstance`, and `approvalLog`.
- **Cross-owner relation reads remain.** Asset-unit `findByIds` now reads owned
  scalar rows and hydrates asset and status through public capabilities; its
  condition and location lookup ports are not called. Normal asset-unit list,
  detail, and mutation hydration still resolves the full output shape. The
  asset-unit `findAll` path retains asset-name relation search/order and status
  relation filtering as deferred ownership residue. The active asset include
  only contains owned `units`, but
  `circulation/infrastructure/persistence/prisma/prisma-circulation.includes.ts:3-16`
  projects circulation loan items through asset, location, status, and condition;
  `prisma-circulation.repository.ts:445-447` also projects history through unit
  and asset. These are deferred/violation findings under the repository owner
  rule, even though they are read-only projections.
- **Unused legacy projection removed.** The former
  `ASSET_UNIT_WITH_DETAILS_INCLUDE` definition had no active source imports and
  was deleted. Active `ASSET_WITH_DETAILS_INCLUDE` behavior remains unchanged:
  it projects only live asset-owned units.
- **Foreign relation connects remain in asset writes.** Asset creation connects
  category, funding source, condition, status, and location; asset-unit updates
  connect condition, status, and location. These do not create or update the
  reference rows, but they still rely on Prisma relation operations against
  foreign-owner models. Public lookup ports now cover validation/read
  projections; relation-write cleanup remains deferred.
- **No cross-owner transaction writes remain in production adapters.** The only
  interactive transactions are approval-local workflow writes and
  circulation-local loan writes. `shared/infrastructure/inventory-unit-movement.steps.ts`
  contains capability calls only and no Prisma client.

### T079 Classification

Ownership assignment: **PASS**, 15 models and one owner each.

Repository-wide cross-owner access: **FAIL, residual deferred violations**.
Foreign relation predicates/order and projections in asset-unit and circulation,
plus relation connects in asset writes, remain. Asset-unit `findByIds` uses only
public asset/status capabilities and does not call condition/location ports; the
unused legacy include was removed. T079 records evidence only; circulation,
approval, and relation-write cleanup remain scoped follow-up work.

## Boundary Rules

- Foreign keys between owned models remain database relationships, but a
  repository may query only its own model set.
- A module needing another module's data injects a narrow public port.
- Local transactions may span several writes only when all writes belong to
  one module.
- Cross-module sequences use awaited calls, explicit failure state,
  idempotency, and repair/retry behavior.
- No schema or migration change is implied by this data model.

## Current Access Evidence (2026-09-16)

Review date: 2026-09-16. The final ownership review covers every production
`*.ts` file under `src/inventory/`, including Prisma adapter include definitions
and the shared movement helper. Test doubles and source strings inside specs are
excluded from runtime ownership classification.

### Current model access

- `reference-data/category`, `reference-data/condition`,
  `reference-data/funding-source`, `reference-data/location`, and
  `reference-data/status` adapters access only their own lookup delegates.
- `asset` adapters access only `InventoryAsset` and `InventoryAssetUnit`.
  Same-owner asset and asset-unit relation predicates, ordering, and projections
  remain inside the asset adapter. Related category, funding-source, condition,
  status, and location data crosses public lookup ports. Foreign-key writes use
  scalar IDs, not relation `connect` or `disconnect` operations.
- `circulation` accesses only `InventoryLoan`, `InventoryLoanItem`,
  `InventoryHistory`, and `InventoryTransactionType`. Loan and history
  projections use public asset-unit capability ports; active-unit filtering uses
  the asset capability.
- `approval` accesses only `ApprovalWorkflow`, `ApprovalStep`,
  `ApprovalInstance`, and `ApprovalLog`. Loan, unit, and history consequences
  use awaited circulation and asset capability ports outside the approval-local
  transaction.
- Local transactions contain only writes owned by their module. The shared
  movement helper contains capability calls and no Prisma client.

### Current result

- **15/15 models have exactly one owner.**
- **Cross-owner Prisma access: PASS.** No foreign delegate, relation include,
  relation predicate, or relation write remains in production persistence.
- **Cross-owner transaction writes: PASS.** Approval and circulation
  transactions contain only owned writes.
- Capability hydration preserves existing missing-related-record behavior: absent
  related data maps to the existing null or omitted projection rather than a new
  exception.
- `src/inventory/asset/infrastructure/persistence/prisma/prisma-asset-unit.reader.ts`
  and its mapping companion remain under the 300-line non-repository budget.
- Fresh focused suites and `pnpm run validate` evidence are recorded in
  `quickstart.md`.
