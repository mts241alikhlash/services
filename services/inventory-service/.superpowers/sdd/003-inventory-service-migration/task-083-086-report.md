# T083-T086 Report

The verification and concern sections below record intermediate review rounds.
Later T087-T090 work and final validation supersede their open-task and
repository-wide-check wording.

## Status

T083-T086 complete. No Git metadata exists in `inventory-service`; no worktree,
commit, push, or subagent was used.

## Scope

Implemented the approved `approval-orchestration.md` contract only. No endpoint,
DTO, package, event, queue, repair table, or unrelated public API change was
added. The approved schema migration is the only database change.

## T083: Domain Contracts

- Added plain `ApprovalConsequenceType`, `ApprovalConsequenceStatus`, and
  `ProcessApprovalConsequence` contracts.
- Added consequence state to `ApprovalLogRepositoryOutput`, the local approval
  transaction input, and `ProcessApprovalResult`.
- Added `IApprovalRepository.transitionLogConsequence` with conditional status
  transitions.
- Kept approval domain and application contracts free of Prisma and HTTP types.

## T084: Local Persistence And Orchestration

- `PrismaApprovalRepository.processApprovalTransaction` now writes only
  `ApprovalLog` and `ApprovalInstance` inside its local Prisma transaction.
- Final approval and rejection consequences run after local persistence through
  awaited circulation and asset capabilities.
- Calls remain ordered: loan status, loan items, unit statuses, then history.
- Intermediate approval skips all downstream consequence calls.
- History records use `<approvalLogId>:<unitId>` operation keys.

## T085: Idempotency And Retry

- Existing completed actions replay from stored log state without side effects.
- Existing failed actions transition `FAILED` to `PENDING`, then retry without a
  second approval log.
- Existing pending actions resume consequence processing.
- A different action occupying the active step returns the existing not-pending
  error.
- Added `ApprovalLog(instanceId, stepSequence)` uniqueness as the database race
  guard.
- Keyed history writes use Prisma `upsert`; unkeyed manual history keeps create
  behavior.

## T086: Failure And Repair State

- Final and rejection logs start `PENDING`; intermediate logs start
  `NOT_REQUIRED`.
- Downstream failure attempts `PENDING` to `FAILED` persistence and returns the
  safe message `Approval consequence could not be completed. Retry this action.`
- Failure-state persistence errors rethrow the original downstream exception.
- Conditional transition races return stored `COMPLETED` or `FAILED` state
  instead of reporting stale success.
- Added `consequenceError` and `consequenceUpdatedAt` persistence.

## Schema

Added migration
`prisma/migrations/20260915100000_approval_consequence_state/migration.sql`:

- `ApprovalConsequenceType` enum.
- `ApprovalConsequenceStatus` enum.
- Four `ApprovalLog` consequence fields.
- Unique `approval_logs(instance_id, step_sequence)` index.
- Nullable unique `inventory_histories.operation_key` index.

## TDD Evidence

Red runs preceded each production fix:

- Initial process-approval suite failed because the new consequence transaction
  payload was not present in the expected call.
- Retry-claim race test failed with 2 failures and 24 passing tests.
- Missing-completion-transition test failed with 1 failure and 26 passing tests.
- Failure-state race test failed with 1 failure and 27 passing tests.

Green runs:

- Process-approval suite: 1 suite, 28 tests passed.
- Approval and circulation persistence scope: 10 suites, 80 tests passed.
- Full inventory Jest scope: 70 suites, 370 tests passed, 0 failures.

## Verification

Commands run from `D:\Project\241 Apps\inventory-service`:

| Command | Result |
|---|---|
| `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory --runInBand` | PASS, 70 suites / 370 tests |
| `pnpm exec eslint "src/inventory/approval/**/*.ts" "src/inventory/circulation/domain/repositories/history.repository.ts" "src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.ts" --max-warnings=0` | PASS |
| `pnpm run lint:strict` | PASS |
| Scoped `pnpm exec prettier --check ...` | PASS |
| `pnpm exec prisma validate` | PASS |
| `pnpm exec prisma generate` | PASS |

Repository-wide checks remain blocked by existing findings outside this task:

- `pnpm run lint`: existing `src/inventory/asset/infrastructure/persistence/prisma/prisma-asset.repository.ts:53` array-type error.
- `pnpm run format:check`: existing formatting warnings in asset, inventory composition, condition, and lookup-port files.
- `pnpm exec tsc --noEmit`: existing errors in two asset specs and the existing
  return-loan fixture at `src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.spec.ts:462`.
- `pnpm run validate` was not run per task scope instruction.

## Concerns

- A simultaneous first submission can still surface the database unique
  constraint error if both requests pass the application pre-check. The unique
  index remains the race guard; mapping that database error to replay behavior
  belongs to a later hardening task if required.
- Migration deployment was not run. Schema validation and client generation
  passed; applying migration remains an environment operation.
- T087-T090 were completed later; see `task-087-090-report.md`.

## Reviewer Fixes

Applied TDD fixes for reviewer findings without changing schema, endpoint,
package, event, or table scope.

### Red Runs

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runInBand src/inventory/approval/application/use-cases/process-approval/process-approval.use-case.spec.ts
```

Output:

```text
FAIL src/inventory/approval/application/use-cases/process-approval/process-approval.use-case.spec.ts (17.132 s)
Tests:       3 failed, 32 passed, 35 total
```

The failures were the new lost-claim reload, pending lost-claim non-success,
and terminal reread cases.

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runInBand src/inventory/approval/infrastructure/persistence/prisma/prisma-approval.repository.spec.ts
```

Initial fixture-adjustment output:

```text
FAIL src/inventory/approval/infrastructure/persistence/prisma/prisma-approval.repository.spec.ts
Tests:       5 failed, 6 passed, 11 total
```

After correcting test-only transaction callback wiring, the production red
run was:

```text
FAIL src/inventory/approval/infrastructure/persistence/prisma/prisma-approval.repository.spec.ts
Tests:       2 failed, 9 passed, 11 total
```

The remaining failures were the expected missing transaction-scoped
transition and immutable-completion behavior.

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runInBand src/inventory/approval/infrastructure/persistence/prisma/prisma-approval.repository.spec.ts src/core/filters/http-exception.filter.spec.ts
```

Output before production fixes:

```text
FAIL src/inventory/approval/infrastructure/persistence/prisma/prisma-approval.repository.spec.ts
Tests:       4 failed, 7 passed, 11 total
```

### Green Run

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runInBand src/inventory/approval src/inventory/circulation src/core/filters/http-exception.filter.spec.ts
```

Output:

```text
Test Suites: 19 passed, 19 total
Tests:       129 passed, 129 total
Snapshots:   0 total
Time:        19.297 s
```

### Changes

- `transitionLogConsequence` now runs conditional update and lost-claim
  reread inside one approval-only Prisma transaction and returns ownership
  with the stored row. `COMPLETED` cannot be mutated.
- Consequence callers reload after ownership loss. Stored `COMPLETED` and
  `FAILED` states replay; a still-`PENDING` state never returns success.
- First-submit approval-step P2002 recovery rereads the instance and resumes
  the same approver/action, or returns the existing not-pending error for a
  conflicting approver/action.
- Existing retry semantics keep persisted consequence type and note; incoming
  `forwardToNextApprover` does not recalculate an existing `PENDING` or
  `FAILED` action.
- Existing 5xx filter behavior was retained and covered by a focused raw
  `InternalServerErrorException` response test. HTTP output contains no raw
  infrastructure message, URL, credentials, or stack.
- The three reported stale fixture locations required no edits; clean
  typecheck confirmed them without unrelated cleanup.

### Verification

Command:

```text
pnpm exec eslint "src/inventory/approval/**/*.ts" "src/core/filters/http-exception.filter.ts" "src/core/filters/http-exception.filter.spec.ts" --max-warnings=0
```

Output: no output; exit code 0.

Command:

```text
pnpm run lint:strict
```

Output: `clean — nothing to commit`; exit code 0.

Command:

```text
pnpm exec prettier --check "src/inventory/approval/**/*.ts" "src/core/filters/http-exception.filter.ts" "src/core/filters/http-exception.filter.spec.ts"
```

Output:

```text
Checking formatting...
All matched files use Prettier code style!
```

Command:

```text
pnpm exec tsc --noEmit --pretty false --incremental false
```

Output: no output; exit code 0.

`pnpm run validate` was not run as instructed. No commit, worktree, push, or
subagent was used.

### Remaining Concerns

- At time of this intermediate report, migration deployment had not been run;
  the migration was later applied to the configured local database during final
  verification. Each staging or production environment still requires its own
  `pnpm prisma:deploy` run.
- T087-T090 were completed later; see `task-087-090-report.md`.

## Reviewer Fix Round 2

### Status

Closed reviewer findings for T083-T086. No schema, endpoint, package, event,
table, worktree, commit, push, or subagent change. `pnpm run validate` was not
run per instruction.

### Changes

- Added a fixed five-minute `CONSEQUENCE_LEASE_MS` for existing `PENDING`
  consequences. Fresh `PENDING` returns the safe in-progress
  `InternalServerErrorException` without loan, loan-item, unit, or history
  calls. Stale `PENDING` conditionally reclaims with `PENDING` to `PENDING` and
  refreshes `consequenceUpdatedAt`. `FAILED` still retries through
  `FAILED` to `PENDING`. The log creator executes its initial `PENDING`
  consequence directly and does not re-claim it.
- Documented lease ownership, five-minute cost, and idempotency implications in
  `specs/003-inventory-service-migration/contracts/approval-orchestration.md`.
- Removed query strings from filter log paths and removed raw exception details
  and stack values from structured 5xx logs. Status, response time, user ID,
  generic summary, and existing response envelopes remain.
- `resultForLog` now supplies the safe
  `Approval consequence could not be completed. Retry this action.` fallback
  whenever persisted FAILED error text is null.
- Replaced invariant-path `throw new Error()` behavior introduced by this round
  with `InternalServerErrorException`; downstream failure persistence still
  rethrows the original downstream error internally.
- Extracted cohesive consequence execution and result mapping to
  `process-approval-consequence.ts`. The use case has 295 counted code lines
  after excluding 29 import lines, within the 300-line constitution budget.

### Red Runs

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runInBand src/inventory/approval/application/use-cases/process-approval/process-approval.use-case.spec.ts src/core/filters/http-exception.filter.spec.ts
```

Output after focused tests were added and before production fixes:

```text
Test Suites: 2 failed, 2 total
Tests:       4 failed, 49 passed, 53 total
```

Failures covered fresh PENDING reclamation, creator-side duplicate claim,
missing FAILED error fallback, and filter log stack/details/query redaction.

### Green Runs

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runInBand src/inventory/approval src/core/filters/http-exception.filter.spec.ts src/inventory/circulation/infrastructure/persistence/prisma/prisma-circulation.repository.spec.ts
```

Output:

```text
Test Suites: 11 passed, 11 total
Tests:       110 passed, 110 total
Snapshots:   0 total
```

### Verification

| Command | Result |
|---|---|
| `pnpm exec eslint "src/inventory/approval/**/*.ts" "src/core/filters/http-exception.filter.ts" "src/core/filters/http-exception.filter.spec.ts" --max-warnings=0` | PASS, no output / exit code 0 |
| `pnpm exec eslint -c eslint.typecheck.config.mjs "src/inventory/approval/application/use-cases/process-approval/process-approval-consequence.ts" "src/inventory/approval/application/use-cases/process-approval/process-approval.use-case.ts" "src/core/filters/http-exception.filter.ts" --max-warnings=0` | PASS, no output / exit code 0 |
| `pnpm exec prettier --check "src/inventory/approval/**/*.ts" "src/core/filters/http-exception.filter.ts" "src/core/filters/http-exception.filter.spec.ts"` | PASS, all matched files use Prettier code style |
| `pnpm run lint:strict` | PASS, `clean — nothing to commit` / exit code 0 |
| `pnpm exec tsc --noEmit --pretty false --incremental false` | PASS, no output / exit code 0 |
| `rg -c "\\S" "src/inventory/approval/application/use-cases/process-approval/process-approval.use-case.ts"` | PASS, 324 nonblank lines; 295 counted code lines after 29 import lines excluded |
| `rg -n "throw new Error\\(" "src/inventory/approval/application/use-cases/process-approval" "src/core/filters/http-exception.filter.ts"` | PASS, no production matches |
| `pnpm run validate` | NOT RUN, explicitly prohibited |

### Concerns

- The five-minute lease is fixed in code, not configurable. An abandoned
  consequence can block a retry for up to five minutes; a consequence running
  longer than five minutes can be reclaimed. Loan status and unit writes are
  target-state writes, and history is keyed by approval log and unit, so those
  retries remain idempotent.
- Migration deployment remains an environment operation and was not run.
- Existing unrelated repository-wide findings remain outside this round; no
  full `validate` result is claimed.
- T087-T090 were completed later; see `task-087-090-report.md`.
