# T081 Report

This report records characterization behavior before T085-T090. Later approval
orchestration work supersedes its residual findings; final evidence is in
`task-087-090-report.md` and `quickstart.md`.

## Status

T081 complete.

## Scope

Re-read the approval characterization tests and current
`ProcessApprovalUseCase` after T076. Updated:

- `specs/003-inventory-service-migration/research.md`
- `specs/003-inventory-service-migration/tasks.md`
- `.superpowers/sdd/003-inventory-service-migration/progress.md`

No production source, schema, package, API contract, or dependency changed.

## Recorded Outcomes at characterization time

- Missing instance returns `NotFoundException('Approval instance not found.')`.
- Missing or changed pending status returns the existing not-pending
  `BadRequestException`.
- Missing active step returns the existing invalid-step `BadRequestException`.
- Exact active-step role matching remains required. `SUPER_ADMIN` is not a
  use-case bypass.
- Approval with a mandatory or explicitly forwarded next step persists only
  approval state and returns `APPROVE_STEP`.
- Final approval persists approval state, then awaits loan, unit, and history
  consequences and returns `APPROVE_FINAL`.
- Rejection persists approval state, then awaits rejected-loan, available-unit,
  and cancellation-history consequences and returns `REJECT`.
- Reference-data failure occurs before approval-local persistence.
- Local approval persistence errors roll back local approval writes.
- Post-commit consequence errors propagated with no failure or repair state at
  characterization time.
- Final/rejected duplicates got the not-pending error. Intermediate duplicates
  had no idempotency check and were evaluated against the new active step at
  characterization time.

## Boundary Reconciliation

The pre-T076 baseline described one Prisma transaction spanning approval,
circulation, asset-unit, and history writes. Current code uses an approval-local
transaction followed by awaited public capability calls. Research now labels the
old behavior as baseline and records the current behavior separately.

Pending role filtering and per-loan detail capability reads were characterization
residuals assigned to T087 and T088. T085, T086, and T089 later completed
idempotency and repair-state work.

## Verification

Focused command run from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/approval/application/use-cases/process-approval/process-approval.use-case.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

`pnpm run validate` was not run for this documentation-only task. Later final
validation is recorded in `quickstart.md`.
