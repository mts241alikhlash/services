# T073 Report

## Status

T073 complete.

## Changes

- Removed direct `inventoryAssetUnit`, `inventoryStatus`, and
  `approvalWorkflow` access from `prisma-circulation.repository.ts`.
- Kept circulation repository persistence for loan, loan-item, history, and
  transaction-type owned records.
- Added public asset capabilities for unit lookup and awaited unit status and
  condition mutations.
- Added public approval capabilities for active workflow lookup and approval
  instance creation.
- Added public status lookup capability for system-key status IDs.
- Added awaited application orchestration for create and return flows:
  - Create: loan persistence, asset pending movement, workflow lookup and
    instance creation, or automatic approval movement when no workflow exists.
  - Return: loan return persistence, asset status/condition movement, and
    history recording.
- Preserved existing NestJS errors and messages for missing statuses, missing
  units, unavailable units, missing references, already-returned loans, and
  units outside a loan.
- Preserved approval retry/idempotency implementation. T081-T090 behavior was
  not redesigned.
- Added failing repository isolation and orchestration-order tests before
  production changes. Updated focused module and adapter tests for the new
  public ports.

## Boundary Check

`prisma-circulation.repository.ts` contains no references to:

- `inventoryAssetUnit`
- `inventoryStatus`
- `approvalWorkflow`

The repository still owns and persists loan, loan-item, history, and
transaction-type records.

## Verification

Red tests ran before production changes:

```text
2 repository isolation tests failed because circulation still called
inventoryAssetUnit movement.
1 orchestration test failed because CreateLoanUseCase had no asset/approval
ports.
```

Focused command run after implementation:

```bash
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns "inventory/(circulation|asset|approval)" --runInBand
```

Result:

```text
Test Suites: 34 passed, 34 total
Tests:       151 passed, 151 total
```

Formatting ran on changed TypeScript files with Prettier.

Typecheck, lint, build, full Jest, schema, package, planning, and task checks
were not run because T073 requested focused circulation/asset/approval Jest
tests only.

No subagents used. No commit created.
