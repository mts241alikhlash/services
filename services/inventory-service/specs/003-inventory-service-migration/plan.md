# Inventory Service Clean Architecture Migration Plan

> **For agentic workers:** Generate `tasks.md` with `/speckit-tasks`, then execute it through Superpowers subagent-driven development. Anti-Slop applies during implementation. This plan is planning-only and creates no source changes.

**Implementation status:** Complete as of 2026-09-16. The plan remains the
source of intended architecture; current validation and residual risks are
recorded in `quickstart.md`.

**Goal:** Migrate all inventory business modules to Clean Architecture and enforce module table ownership without changing public behavior.

**Architecture:** Keep `inventory-service` as one deployable service with one owned database. Inside it, each business module converges on `domain/`, `application/`, `infrastructure/persistence/prisma/`, and `presentation/http/`. Cross-module calls use narrow public ports. Approval consequences become explicit awaited orchestration with visible retry/repair state rather than one repository transaction spanning foreign tables.

**Tech Stack:** Node.js 24, TypeScript 5.9, NestJS 12, Prisma 7, PostgreSQL, Jest 30, class-validator, pnpm, NodeNext ESM.

**Spec:** `specs/003-inventory-service-migration/spec.md`

## Global Constraints

- Preserve existing routes, permissions, validation, response envelope, status codes, search/filter/order/pagination behavior, period scoping, soft-delete behavior, and error behavior unless an explicitly planned boundary repair defines the equivalent outcome.
- Follow `presentation -> application -> domain`; `infrastructure -> domain` in every business module.
- Domain and application do not import Prisma, `PrismaService`, HTTP DTOs, controllers, or concrete infrastructure.
- Only `infrastructure/persistence/` imports Prisma persistence types or `PrismaService`.
- Repository ports define explicit plain input/output types beside abstract tokens; no `Partial` create/entity write surfaces.
- One use case per file. Structured inputs are plain application interfaces without decorators. Use cases map fields explicitly.
- Repository model access follows the ownership matrix in `data-model.md`.
- Cross-module writes use awaited public ports and local transactions; never one Prisma transaction across module-owned tables.
- Preserve the single centralized `SUPER_ADMIN` bypass in `PermissionGuard`.
- Circulation characterization tests precede structural moves. Existing tests are preserved.
- No new dependency, service, table, migration, event mechanism, generic base repository, or unrelated API change.
- Each wave has focused tests, static checks, scoped review, and `pnpm run validate` at final completion.
- Use ESM-safe Jest command: `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=<path> --runInBand`.

---

## File Map

| Area | Responsibility |
|---|---|
| `src/inventory/reference-data/*` | Five independent lookup modules and metadata composition. |
| `src/inventory/asset/` | Asset and asset-unit ownership, policies, and public ports. |
| `src/inventory/circulation/` | Loan, loan-item, history, and transaction-type ownership. |
| `src/inventory/approval/` | Workflow, approval instance/log ownership and orchestration boundary. |
| `src/inventory/shared/` | Kernel-only types/constants/helpers; no business ownership. |
| `specs/003-inventory-service-migration/` | Master program artifacts and execution evidence. |
| `docs/ARCHITECTURE.md` | Measured final structure, ownership, order, and gates. |

## Wave 0: Baseline and Characterization

**Purpose:** Freeze observable behavior and map all ownership/coupling before structural moves.

**Inputs:** `spec.md`, `data-model.md`, current source, existing `001-category-layering` and `002-condition-layering` evidence.

**Required evidence:** route/permission inventory, model-to-module access matrix, use-case/DTO import counts, current test counts, current `pnpm run validate`, and approval/circulation behavior cases.

**Boundaries to characterize:**

- `circulation` five use cases, including borrow and return.
- `approval` process action, pending query, workflow lookup, role matching, and loan detail lookup.
- Asset soft-delete, latest asset selection, unit lendability, and reference lookup behavior.
- Cross-module `approval -> circulation/asset` writes and failure outcomes.

## Wave 1: Reference-Data Layering

Migrate `reference-data/funding-source`, `reference-data/location`, and `reference-data/status` one module at a time, using `category` and `condition` as templates. Update metadata consumers only through public module exports. Preserve reference lookup strings and response DTO contracts.

Each module slice includes repository port, Prisma adapter, use-case inputs, use-case folders, HTTP presentation, module wiring, focused tests, stale-import check, and validation.

## Wave 2: Asset Layering and Ownership

Layer `asset` with separate public ports for asset and asset units. Preserve existing unit lendability test and add characterization for all nine use cases. Move persistence to Prisma infrastructure. Replace direct category/funding/reference model reads with narrow public ports. Keep asset and unit local transactions only where both writes belong to asset ownership.

Explicit risks:

- `findLatestAsset` soft-delete filtering.
- unit and asset delete semantics.
- duplicate asset-number formatting.
- asset repository includes and response mapping.
- unit references to condition/status/location.

## Wave 3: Circulation Layering and Ownership

Layer `circulation` only after its five use cases have characterization specs. Separate loan, history, and transaction-type capabilities behind domain ports as needed. Move Prisma adapter and HTTP DTOs/controllers. Replace direct asset-unit/status reads with public ports. Keep loan, loan-item, history, and transaction-type writes local to circulation.

Explicit risks:

- create-loan and return-loan transaction sequencing.
- status and transaction-type lookup contracts.
- period and pagination scoping.
- empty-unit and invalid-status failure behavior.

## Wave 4: Approval Boundary Redesign

Do not mechanically layer approval before deciding ownership. First preserve current approval outcomes with tests. Then split workflow persistence from downstream consequences:

- approval repository queries only `ApprovalWorkflow`, `ApprovalStep`, `ApprovalInstance`, and `ApprovalLog`;
- circulation public port owns loan and loan-item changes;
- asset public port owns asset-unit changes;
- history writes remain circulation-owned;
- approval application orchestrates awaited calls and records visible retry/repair state using the smallest shape required by characterization;
- no cross-module Prisma transaction, network call inside an interactive local transaction, or fire-and-forget event.

Fix repository query shape while preserving contract:

- push role filtering into Prisma query rather than fetch-all/filter-memory;
- remove N+1 pending approval lookup through a repository projection or one query;
- preserve exact workflow role matching and centralized bypass behavior.

Any new repair endpoint or persisted state requires a task with an explicit API/data contract before implementation. Prefer existing routes if they can expose repair without contract expansion.

## Wave 5: Shared Kernel and Composition Cleanup

Review `shared/` after module moves. Keep only domain-neutral enums, constants, narrow types, exceptions, and helpers. Move business rules into owning modules. Update `inventory.module.ts` and module exports to public APIs without creating import cycles.

## Wave 6: Final Hardening

Run repository-wide static checks for old layouts, DTO leaks, Prisma leaks, ownership violations, soft-delete omissions, period-scope omissions, role bypass copies, route collisions, and response-contract drift. Update `docs/ARCHITECTURE.md` measurements and migration status. Run full `pnpm run validate`.

## Verification Protocol

For each module/boundary slice:

1. Add or confirm characterization tests.
2. Run focused ESM-safe tests and observe expected red before production movement when adding new seams.
3. Make smallest structural change.
4. Run focused tests, typecheck, lint, strict lint.
5. Review source against ownership and dependency rules.
6. Run full validation at wave completion.
7. Run scoped Superpowers task review and fix loop before next task.

Final command:

```bash
pnpm run validate
```

## Dependencies

```text
Wave 0 baseline
  -> Wave 1 reference-data layering
  -> Wave 2 asset layering and ports
  -> Wave 3 circulation layering and ports
  -> Wave 4 approval boundary redesign
  -> Wave 5 shared/composition cleanup
  -> Wave 6 final hardening
```

Within Wave 1, reference-data modules are sequential for one-module-per-commit review. Wave 2 blocks on reference-data public ports. Wave 3 blocks on asset ports. Wave 4 blocks on circulation and asset ports. Wave 5 and Wave 6 block on all prior waves.

## MVP

MVP is not one source diff. MVP planning output is complete `tasks.md` with
Wave 0 through Wave 6 tasks. The full implementation now includes all waves,
including asset, circulation, approval, and final hardening. Final evidence and
environment blockers remain in `quickstart.md`.
