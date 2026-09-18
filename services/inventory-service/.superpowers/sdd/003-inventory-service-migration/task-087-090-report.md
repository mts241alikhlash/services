# T087-T090 Report

## Status

T087-T090 complete.

## Changes verified

- `findPendingInstancesForRoles` applies pending status and requested role codes
  in Prisma query predicates. Empty role input returns no instances without an
  instance query.
- Pending approval loan IDs are deduplicated and loaded through one bulk
  `ILoanCapabilityPort.findDetailsByIds` call. Returned approvals preserve
  instance order and missing loan details map to `null`.
- Approval process coverage includes next-step approval, final approval,
  rejection, role mismatch, missing state, duplicate/replay, fresh and stale
  `PENDING`, `FAILED` retry, consequence failure, and race outcomes.
- Approval persistence coverage verifies approval-owned Prisma delegates,
  database-side role filtering, bulk detail behavior, explicit projections, and
  safe failure state.

## Verification

Commands run from `D:\Project\241 Apps\inventory-service` on 2026-09-16:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/approval --runInBand
Test Suites: 9 passed, 9 total
Tests:       93 passed, 93 total
```

The approval suite emitted only the known Node VM-modules warning. Full
validation evidence is recorded in `quickstart.md`.

## Residual risk

The approved `20260915100000_approval_consequence_state` migration is applied to
the configured local database. Each staging or production environment must
deploy it before approval consequence retry state is used there. No endpoint,
package, event, queue, or additional table was added.
