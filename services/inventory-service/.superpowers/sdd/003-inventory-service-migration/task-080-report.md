# T080 Report

This report records the T080 snapshot. Approval retry and repair work was
completed later by T081-T090; final evidence is in `quickstart.md`.

## Status

T080 complete as regression-evidence work. Period scope is not applicable to
the current model and input shapes. Approval repair was outside T080 and belongs
to T081-T090.

## Scope

Added minimum regression coverage by extending existing asset, circulation, and
approval persistence suites. No duplicate suites added. No schema, package,
planning, or task files changed by T080. No approval retry or repair behavior
changed in T080.

## Coverage

- Asset unit list keeps `deletedAt: null`, pushes lendability and search into
  Prisma predicates, applies database pagination/order, and counts using the
  same predicate instead of filtering a wide read in memory.
- Circulation loan-item and history reads scope through live asset units with
  `deletedAt: null` in Prisma `where` clauses.
- Approval pending reads include pending status and requested role codes in the
  Prisma workflow-step predicate. Existing exact active-step role behavior stays
  covered.
- No period scope test was added: inventory models have no period key and
  circulation query inputs expose no period field. This is an explicit
  not-applicable result, not missing coverage, and no unsupported behavior was
  invented.

## Production Fixes

Regression tests first exposed two required defects:

- `PrismaAssetUnitRepository.findAll` performed wide reads, then filtered and
  paginated in memory.
- `PrismaApprovalRepository.findPendingInstancesForRoles` queried all pending
  instances before role filtering.

Production changes only push required predicates and pagination into Prisma.
Approval transaction, retry, idempotency, failure-state, and repair behavior
remained untouched by T080. Those concerns belonged to T081-T090 and were
completed later.

## Verification

Command run from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns="inventory/asset|inventory/circulation|inventory/approval" --runInBand
Test Suites: 35 passed, 35 total
Tests:       159 passed, 159 total
Snapshots:   0 total
Time:        9.021 s
Ran all test suites matching inventory/asset|inventory/circulation|inventory/approval.
```

No subagents used. No commit created.
