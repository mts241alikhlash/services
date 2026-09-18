# SDD ledger - plan: inventory-service/specs/003-inventory-service-migration/plan.md

Ruling: Git metadata is absent, so execution stays in the current inventory-service directory; no worktree, commit, push, or destructive cleanup.

## Preflight scan

| Scope | Result |
|---|---|
| Plan/spec conflict | None found before Wave 0. |
| Cross-task file overlap | Documentation tasks intentionally share migration artifacts; execution remains sequential for those files. |
| TDD requirement | New behavior tests precede production movement in later waves. |
| Approval boundary | Approval cross-module transaction remains untouched until characterization and ownership tasks define replacement. |

## Progress

Task T001-T006: complete (one documentation fact corrected; no Git commit available).

Evidence: `pnpm prisma:generate` exit 0; `pnpm run validate` exit 0; 23 suites and 142 tests passed.
Review: initial reviewer found the review package path and one incorrect `rack` length; path verified present and `rack` corrected from 50 to 100.

Task T013-T021: complete (controller characterization tests; no Git commit available).

Evidence: focused 9 suites / 51 tests passed; all controller 11 suites / 63 tests passed; Prettier, ESLint, strict ESLint, and typecheck passed. Review findings closed: route paths, DTO metatypes, global validation options, DTO edges, exact 403 failures, guards, Swagger, exact validation failures, and duplicate assertions.

Task T013-T021: review failed with Important findings: handler path suffixes not asserted, DTO wiring not asserted, ValidationPipe omitted `forbidNonWhitelisted`, asset query validation missing, permission tests weak/missing, and several DTO rule assertions incomplete. Fix round 1 dispatched to original implementer.

Task T022: review partial. Fix required: assert create-loan intermediate repository arguments, assert all return-loan reference lookups are skipped on missing loan, and make daily loan-number characterization deterministic. Fix round 1 dispatched.

Task T022: complete (review clean; no Git commit available).

Evidence: focused T022 5 suites / 16 tests passed; ESLint, strict ESLint, Prettier, and typecheck passed. Full-suite unrelated findings remain outside T022 scope.

Task T023: complete (review PASS; quality status PASS after verified fixes; no Git commit available).

Evidence: 13 asset suites / 57 tests passed; asset Prettier, ESLint, strict ESLint, and typecheck passed. Three justified production fixes were verified: supplied `assetNumber` mapping, soft-delete filtering in latest asset queries, and soft-delete filtering in latest unit query. Changed production files: `src/inventory/asset/use-cases/create-asset.use-case.ts`, `src/inventory/asset/infrastructure/persistence/prisma-asset.repository.ts`, and `src/inventory/asset/infrastructure/persistence/prisma-asset-unit.repository.ts`. Full repository format check remains blocked by unrelated pre-existing `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`.

Task T024: review partial. Fix required: exact role/no-next errors, blocked transaction assertion on role denial, null loan-detail mapping, and complete transaction payload assertions. Fix round 1 dispatched.

Task T024: complete (review clean; no Git commit available).

Evidence: focused approval use-case tests 5 suites / 35 tests passed; Prettier, ESLint, strict ESLint, and typecheck passed. Existing create-workflow validation coverage remains unchanged as pre-existing follow-up.

Task T025: complete (reviewed; no Git commit available).

Evidence: exact characterization command exit 0; 50 suites and 266 tests passed after fixing T015's scanner-sensitive invalid enum fixture.

Task T026: partial and carried forward. Safe smoke run proved authorized 200, unauthenticated 401, invalid input 400, unknown ID 404, and empty result 200. Missing-permission 403 and identity failure 503 were not simulated because no non-admin credential exists and stopping/overriding shared identity-service is not authorized. Replay script details and post-cleanup evidence remain a quality follow-up.

Task T027: complete (review clean; no Git commit available).

Evidence: contract comparison found all 40 route rows, methods, permissions, DTO wiring, validation, UUID sources, query forwarding, not-found behavior, and statuses aligned. UUID wording and route citations were corrected. Envelope and live 403/503 evidence remain explicitly partial.

Task T028: complete (review clean; no Git commit available).

Evidence: explicit funding-source repository port added; typecheck and focused 6-test suite passed. Repository-wide validation remains blocked only by known unrelated condition-controller formatting debt.

Task T029: complete (review clean after staged-token correction; no Git commit available).

Evidence: adapter moved to Prisma persistence path with explicit mapping; module boot, focused tests, Prettier, ESLint, strict ESLint, and typecheck passed. Module intentionally still uses old token until T030 consumer migration; no duplicate compatibility provider added.

Task T030: complete (review code PASS; process overlap documented; no Git commit available).

Evidence: four funding-source use cases moved to application with plain inputs and no DTO imports; consumers use one repository token. Funding-source tests 2 suites / 12 tests, app boot, build, lint, strict lint, and typecheck passed. T032 remains responsible for final module/consumer wiring review.

Task T031: complete (review clean; no Git commit available).

Evidence: funding-source HTTP controller/spec and DTOs moved under `presentation/http`; route, guard, permission, UUID pipe, Swagger, envelope, and status characterization passed. Funding-source tests 2 suites / 12 tests, app boot, Prettier, ESLint, strict ESLint, and typecheck passed.

Task T032: complete (bookkeeping reconciled; no Git commit available).

Evidence: marked only T032 complete in `specs/003-inventory-service-migration/tasks.md`. T032 contains the final funding-source module/public-consumer wiring and one minimal module-token smoke test proving `IFundingSourceRepository` resolves to `PrismaFundingSourceRepository`. T033 remains open and owns complete funding-source use-case, repository, controller, and module wiring test coverage. T032 verification evidence remains recorded in `task-032-report.md`; no source, package, schema, or other planning changes were made.

Task T033: complete (final review PASS; no Git commit available).

Task T034: complete (review clean; no Git commit available).

Evidence: explicit location repository port added with complete output contract including `building`, `room`, `rack`, `description`, and `createdAt`; typecheck red-green evidence captured. Location tests 1 suite / 7 tests, Prettier, ESLint, strict ESLint, and typecheck passed.

Task T035: complete (review clean; no Git commit available).

Evidence: location Prisma adapter moved under persistence/prisma with explicit full-field mapping; location tests 7/7, Prettier, ESLint, strict ESLint, typecheck, and build passed. Repository tests deferred to T039; stale optional entity `deletedAt` remains P3 cleanup.

Task T036: complete (review clean; no Git commit available).

Evidence: four location use cases moved to application with plain inputs and no DTO imports; six behavior tests added. Location tests 2 suites / 13 tests, app boot, Prettier, ESLint, strict ESLint, typecheck, build, and stale-path scans passed.

Task T037: complete (review clean; no Git commit available).

Evidence: location HTTP controller/spec and DTOs moved under `presentation/http`; Swagger query and DELETE 204 metadata restored through red-green tests. Location tests 2 suites / 13 tests, app boot, Prettier, ESLint, strict ESLint, and typecheck passed.

Evidence: marked only T033 complete in `specs/003-inventory-service-migration/tasks.md`. Corrected `task-033-report.md` to record intentional production entity-contract additions of `description` and `createdAt`, with no other production behavior changes. Final review verified repository output projection, extra ORM-field exclusion, all five Prisma error paths, existing use-case/controller/module coverage, and removal of obsolete funding-source directories. Funding-source tests passed with 4 suites / 23 tests; app boot, metadata, Prettier, ESLint, strict ESLint, typecheck, and build passed. No source or test files changed during reconciliation; no subagents and no commit.

Task T038: complete (final review PASS; no Git commit available).

Evidence: marked only T038 complete in `specs/003-inventory-service-migration/tasks.md`; T039 remains unchecked. Exact old-layout scans returned zero matches for old location `use-cases/`, `infrastructure/`, non-HTTP `presentation/<file>`, and old repository-interface paths while excluding valid `location/presentation/http/` imports. Final review verified one repository token, public `location/index.ts` export boundary, provider/export wiring, metadata consumer, moved-layer dependency direction, and Nest resolution to `PrismaLocationRepository`. Fresh verification passed: location 3 suites / 14 tests, metadata 1 suite / 1 test, app boot 1 suite / 1 test, ESLint, strict ESLint, typecheck, build, and scoped Prettier. Repository-wide format check remains blocked by unrelated `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`. No source, test, package, or schema files changed; bookkeeping changed only the report, T038 task checkbox, and progress ledger; no subagents and no commit.

Task T039: complete (final review PASS; no Git commit available).

Task T040: complete (review clean; no Git commit available).

Evidence: explicit status repository port added; contract fix removed stale `deletedAt` and required nullable `systemKey: InventoryStatusKey | null`. Focused status tests 2 suites / 8 tests passed.

Task T041: complete (review clean; no Git commit available).

Evidence: status Prisma adapter moved under persistence/prisma with explicit enum, nullable system-key, transaction flag, date, input, and output mapping. Focused status tests 2 suites / 8 tests passed. Full checks deferred to Wave 1 gate.

Task T042: review failed on composition. Moved status use cases inject the new repository port while `status.module.ts` still binds the old interface token. Behavior tests pass, but module/metadata consumers cannot resolve until T044 rewires provider/export; T042 remains open pending that fix.

Task T043: complete (review clean; no Git commit available).

Evidence: status HTTP controller/spec and DTOs moved under `presentation/http`; Prisma enum leakage removed in favor of shared domain enum with red-green boundary test. Focused status tests 3 suites / 18 tests passed. T044 owns pending status module token rewiring.

Task T042: complete after T044 composition fix (no Git commit available).

Evidence: status use cases moved to application with plain inputs and no DTO imports; focused status tests 3 suites / 17 tests passed. Final module token resolution verified by T044 app boot.

Task T044: complete (review clean; no Git commit available).

Evidence: status module/provider/export, public port, metadata consumer, and adapter import fully rewired to one token; obsolete interface removed. Status tests 4 suites / 19 tests, metadata, and app boot passed. Full checks deferred to Wave 1 gate.

Task T045: complete (review clean; no Git commit available).

Evidence: status repository tests cover all six enum mappings, explicit input/output mapping, search/order, missing lookup, CRUD errors; controller DELETE 204 metadata and module token wiring covered. Focused status tests 5 suites / 24 tests passed. Legacy status directories removed; full checks deferred to Wave 1 gate.

Wave 2 gate: complete with one known unrelated format blocker.

Evidence: asset batch focused tests 16 suites / 65 tests before final cleanup and 64 tests after dead-method removal; lint, strict lint, typecheck, full Jest 64 suites / 326 tests, build, and asset Prettier passed. Repository-wide format remains blocked only by unrelated `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`. Asset batch review found no remaining defects.

Wave 3 gate: complete with one known unrelated format blocker.

Evidence: circulation batch focused tests 9 suites / 34 tests; lint, strict lint, typecheck, full Jest 66 suites / 334 tests, build, and circulation Prettier passed. Repository-wide format remains blocked only by unrelated condition-controller formatting debt. Batch review passed; ownership redesign remains deferred to T068-T073.

Wave 4 structural gate: complete with one known unrelated format blocker.

Evidence: approval batch focused tests 9 suites / 55 tests; normal lint, typecheck, full Jest 68 suites / 344 tests, build, approval Prettier, and strict lint passed after removing one unnecessary async test callback. Repository-wide format remains blocked only by unrelated condition-controller formatting debt. Ownership redesign begins at T068.

Wave 1 gate: complete with one known unrelated format blocker.

Evidence: funding-source, location, and status migrated-layer Prettier passed; lint, strict lint, typecheck, full Jest 61 suites / 319 tests, and build passed. Repository-wide `format:check` still reports only `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`; status specs were formatted during gate. No production runtime blocker found.

 Evidence: marked only T039 complete in `specs/003-inventory-service-migration/tasks.md`. Final review verified location use-case, Prisma repository, controller, and module wiring coverage without duplicate controller or module assertions. Location-focused verification passed with 5 suites / 25 tests; full Jest regression passed with 57 suites / 302 tests and 0 failures. App boot, metadata, ESLint, strict ESLint, typecheck, build, and scoped location Prettier passed. Repository-wide format check remains blocked by unrelated pre-existing `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`; no format debt was changed. Git metadata remains absent (`git status --short` returned `fatal: not a git repository (or any of the parent directories: .git)`). No source, test, package, schema, or planning files changed; no subagents and no commit.

Task T047-T053: complete after batch review (no Git commit available).

Evidence: asset repository keyword search now requires `deletedAt: null` in both nested unit predicates, so deleted units cannot match. Removed dead `findLatestAsset()` adapter method and obsolete test assertions; preserved `findLatestAssetByPrefix()`. Moved lendable test input to domain `AssetUnitQueryInput`. Corrected T053 dependency-scan report. Focused asset verification passed: 16 suites / 64 tests. No lint, format, typecheck, build, or unrelated tests run; no subagents and no commit.

Task T061-T067: complete after batch review correction (no Git commit available).

Evidence: marked T061-T067 complete in `specs/003-inventory-service-migration/tasks.md`. Strengthened approval loan-detail mapping coverage with ORM-only fields at loan, item, unit, and asset levels, then asserted the explicit nested projection. Added reflection assertions for `CreateWorkflowDto`, `CreateWorkflowStepDto`, and `ApproveActionDto` Swagger property metadata. Focused approval verification passed: 9 suites / 55 tests. No lint, format, typecheck, build, schema, package, or planning checks run; no subagents and no commit. Cross-module Prisma persistence remains explicitly deferred to T068-T073 and later approval orchestration tasks.

Task T081: complete (approval characterization reconciliation; no Git commit available).

Evidence: updated `specs/003-inventory-service-migration/research.md` with the post-T076 approval-local transaction behavior and exact approve-next, final-approve, reject, precondition, role mismatch, duplicate, local-failure, and post-commit downstream-failure outcomes. Recorded that no explicit idempotency or repair state exists and that T085, T086, and T089 own those changes. Marked only T081 complete in `specs/003-inventory-service-migration/tasks.md`. No source, schema, package, contract, or API changes. No `pnpm run validate` run.

Task T082: complete (approval orchestration contract; no Git commit available).

Evidence: added `specs/003-inventory-service-migration/contracts/approval-orchestration.md`. Approved minimum uses `ApprovalLog` consequence state, unique `(instanceId, stepSequence)`, and nullable unique `InventoryHistory.operationKey`; no repair table, endpoint, event, queue, or package. Read-only duplicate audit returned `0` duplicate `(instance_id, step_sequence)` groups, with zero approval logs, instances, and histories in the current database. Marked only T082 complete in `specs/003-inventory-service-migration/tasks.md`. No source or schema migration changed. `pnpm run validate` not run.

Ruling: New approval-log creation grants the creating request consequence ownership; an existing `PENDING` retry may claim only after its `consequenceUpdatedAt` lease is stale. This is the smallest durable cross-replica guard with the approved schema; cost if wrong is delayed retry until the lease expires after a crashed worker.

Historical review note: T083-T086 initially had findings around fresh `PENDING`
reclamation, HTTP log redaction, and the use-case file budget. The findings were
closed in the later T083-T086 fix round.

Ruling: Use one fast-path implementation batch for the remaining approval wave and defer all focused and full validation commands until the source batch is complete, at the user's explicit request. Cost if wrong: defects surface later in one larger validation cycle instead of at each seam.

Task T083-T086: complete (approval consequence orchestration; no Git commit available).

Evidence: added plain approval consequence contracts and persisted consequence fields; split approval-local persistence from awaited loan, unit, and history calls; added approved schema migration for consequence state, the approval-step uniqueness guard, and keyed history idempotency. Final and rejection logs start `PENDING`, intermediate logs use `NOT_REQUIRED`, downstream failures persist a safe `FAILED` result, completed actions replay without side effects, failed actions retry without another log, and history writes use `<approvalLogId>:<unitId>` upsert keys. Added lease and state-race guards so fresh retries do not reclaim active work, and lost retry, failure, and completion transitions return stored state rather than stale success. T083-T086 are marked complete in `specs/003-inventory-service-migration/tasks.md`.

Verification at that stage: approval process suite passed 1 suite / 28 tests;
approval and circulation scoped suites passed 10 suites / 80 tests; full
inventory Jest passed 70 suites / 370 tests; scoped Prettier, ESLint, strict
ESLint, Prisma validation, and Prisma generation passed. Later final validation
superseded the temporary repository-wide findings. No Git metadata, worktree,
commit, or subagent used.

## Final Reconciliation: 2026-09-16

- T001-T103 are marked complete in `tasks.md`.
- Current static review passes. Same-owner asset and asset-unit relation
  predicates and projections are not cross-owner access.
- Focused suites and full validation are recorded in `quickstart.md`.
- On 2026-09-16, `pnpm prisma:deploy` applied
  `20260915100000_approval_consequence_state` to the configured local
  `inventory_service` database; `pnpm prisma migrate status` then reported the
  schema up to date.
- Follow-up HTTP smoke returned health `200`, missing-bearer `401`, and `503`
  for an isolated unreachable identity-service URL. A temporary local identity
  stub returned `STAFF` without permissions and the live route returned `403`.
  Live identity-backed `403` remains unexecuted because no non-admin credential
  is available.
- Remaining deployment and smoke-test limits are environment constraints, not
  open source tasks.
