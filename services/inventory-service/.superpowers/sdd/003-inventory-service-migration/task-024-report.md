# T024 Report: Approval Use-Case Characterization

## Scope

T024 only. Added behavior characterization tests under `src/inventory/approval/use-cases/`.
Production source, DTOs, modules, package files, schema, planning documents, and `tasks.md` remain unchanged.

## Files Changed

- `src/inventory/approval/use-cases/get-workflows.use-case.spec.ts`
- `src/inventory/approval/use-cases/get-workflow-by-id.use-case.spec.ts`
- `src/inventory/approval/use-cases/get-pending-approvals.use-case.spec.ts`
- `src/inventory/approval/use-cases/process-approval.use-case.spec.ts`

## Coverage Added

### Get workflows

- Delegates to `findAllWorkflows` with no arguments.
- Returns the exact repository result.
- Propagates repository read errors.

### Get workflow by ID

- Delegates the requested ID to `findWorkflowById`.
- Returns the exact found workflow.
- Throws `NotFoundException('Workflow template not found.')` for a missing workflow.
- Propagates repository read errors.

### Get pending approvals

- Forwards current-user role codes unchanged to `findPendingInstancesForRoles`.
- Looks up loan details only for `InventoryLoan` instances with a reference ID.
- Maps returned loan details to `details` on each matching instance.
- Returns `details: null` for non-loan instances.
- Skips loan lookup when loan reference ID is empty.
- Propagates pending-instance repository errors.
- Propagates loan-detail repository errors.

### Process approval

- Throws `NotFoundException('Approval instance not found.')` for a missing instance.
- Throws `BadRequestException('This approval request is no longer pending.')` when pending status lookup returns no status.
- Throws the same not-pending error when instance status differs from pending status.
- Throws `BadRequestException('Current approval step sequence is invalid.')` when active step is absent.
- Existing tests retain role-code matching, including rejection of an unmatched `SUPER_ADMIN` role.
- Existing tests retain optional and mandatory next-step behavior, no-next-step forwarding failure, rejection non-forwarding, and final-step behavior.
- Added exact rejection transaction input and returned `REJECT` result coverage.
- Added intermediate forwarding returned `APPROVE_STEP` result coverage.
- Added final approval returned `APPROVE_FINAL` result coverage.
- Verifies current user ID, reference ID, step sequence, pending status ID, note, and next-step fields reach the repository transaction call.
- Propagates downstream `processApprovalTransaction` errors unchanged.

## TDD Evidence

- Tests were added before production changes. No production changes were needed because T024 characterizes existing behavior.
- Initial focused run after adding the first three specs: 5 suites passed, 26 tests passed.
- Focused run after process-approval additions: 5 suites passed, 34 tests passed.
- Final focused run: 5 suites passed, 35 tests passed.

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/approval/use-cases --runInBand
```

## Verification

| Check | Result |
| --- | --- |
| Focused approval use-case Jest | PASS, 5 suites, 35 tests |
| Targeted Prettier check | PASS |
| `pnpm run lint` | PASS |
| `pnpm run lint:strict` | PASS |
| `pnpm run typecheck` | PASS |
| Full `pnpm run format:check` | BLOCKED by unrelated pre-existing `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts` formatting warning |

Targeted formatting command:

```text
pnpm exec prettier --check "src/inventory/approval/use-cases/*.use-case.spec.ts"
```

The full format check was rerun after formatting T024 files. It reported only the unrelated condition controller spec. That file was not changed because T024 forbids out-of-scope edits.

## Scope Check

- No subagents used.
- No commit created.
- No production files changed.
- No DTOs, modules, package files, schema, planning docs, or `tasks.md` changed.

## Review Fix Evidence

Review findings from `task-024-review.md` were addressed in tests only:

- Role mismatch now asserts the exact stable message: `You do not have the required role (ADMIN) to process this step.`
- Role mismatch now asserts `processApprovalTransaction` was not called.
- No-next-approver now asserts the exact stable message: `This workflow has no further approver to forward to.`
- No-next-approver now asserts `processApprovalTransaction` was not called.
- Pending approval mapping now covers `findLoanDetailsForInstance()` returning `null`, producing `details: null`.
- Intermediate approval transaction assertions include `instanceId`, `referenceId`, `currentStepSequence`, `action`, `userId`, `note`, `pendingStatusId`, `hasNextStep`, and `nextStepSequence`.
- Final approval transaction assertions include `instanceId`, `referenceId`, `currentStepSequence`, `action`, `userId`, `note`, `pendingStatusId`, `hasNextStep`, and `nextStepSequence`.
- Shared constants keep identifier and pending-status assertions exact without repeating literal values across those assertions.
- `create-workflow.use-case.spec.ts` was not changed. Its existing validation coverage is a pre-existing follow-up outside these review fixes.

Final verification commands and output:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/approval/use-cases --runInBand
Test Suites: 5 passed, 5 total
Tests:       35 passed, 35 total
Snapshots:   0 total
```

```text
pnpm exec prettier --check "src/inventory/approval/use-cases/*.use-case.spec.ts"
Checking formatting...
All matched files use Prettier code style!
```

```text
pnpm run lint
$ eslint "src/**/*.ts" --max-warnings=0
```

```text
pnpm run lint:strict
$ eslint -c eslint.typecheck.config.mjs "src/**/*.ts" --max-warnings=0
```

```text
pnpm run typecheck
$ tsc --noEmit
```

All five final commands exited with status 0. No production, DTO, module, package, schema, planning-document, or `tasks.md` changes were made. No subagents used. No commit created.

## Review Reconciliation

- Spec review: PASS. T024 coverage and requested review fixes are recorded above.
- Quality review: PASS. Final focused result is 5 suites passed, 35 tests passed; targeted Prettier, ESLint, strict ESLint, and typecheck all exited with status 0.
- `34` remains only in historical entries describing the pre-review-fix run. Final-result entries now consistently report `35` tests passed.
- `create-workflow.use-case.spec.ts` remains unchanged and remains recorded as a pre-existing follow-up.
- This reconciliation changed report bookkeeping only. Tests, production, planning docs, `tasks.md`, package files, and schema were not changed.
