# T025 Report

Date: 2026-09-14
Task: T025, US1 focused controller and use-case suites
Working directory: `inventory-service`

## Command

```bash
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory --runInBand
```

## Initial Result Before Fixture Fix

Exit status: `1`

Suite counts: `1 failed, 49 passed, 50 total`

Test counts: `1 failed, 265 passed, 266 total`

Snapshots: `0 total`

Duration: `16.904 s`, estimated `21 s`

## Warnings

- Node emitted one `ExperimentalWarning`: `VM Modules is an experimental feature and might change at any time`.
- Node printed the related `Use node --trace-warnings ...` guidance.
- Nest emitted three `HttpIdentityAdapter` error logs: two `identity-service request failed or timed out` messages and one `identity-service answered 503` message. These are expected failure-path logs from identity-service tests.

## Failure

```text
FAIL src/inventory/shared/domain/inventory-reference-data.spec.ts
  ● inventory reference data exists for every code the source asks for › ships a status for every system role the code looks up

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 3

    - Array []
    + Array [
    +   "NOT_A_STATUS_KEY",
    + ]

      at Object.<anonymous> (inventory/shared/domain/D:/Project 241 Apps/inventory-service/src/inventory/shared/domain/inventory-reference-data.spec.ts:55:23)
```

Classification: caused by completed characterization batch T015. The invalid
input fixture at
`src/inventory/reference-data/status/presentation/status.controller.spec.ts:243`
uses `NOT_A_STATUS_KEY`. The existing reference-data scan reads all inventory
TypeScript files, interprets this fixture as a production status lookup, and
does not find it in migrations. This is not classified as a pre-existing
unrelated failure.

## Scope Compliance

The fixture fix changed only:

- `src/inventory/reference-data/status/presentation/status.controller.spec.ts`

The fixture changed from `systemKey: 'NOT_A_STATUS_KEY'` to
`systemKey: 'not_a_status_key'`. No production, schema, or package files
changed. No planning or task file changed as part of the fixture fix.

This reconciliation changes T025 records only: `quickstart.md`, this report,
`tasks.md`, and `progress.md`. T026 and T027 remain unchecked.

## Regression Fix

Red cause: `status.controller.spec.ts:243` used `systemKey: 'NOT_A_STATUS_KEY'`. The source scanner in `inventory-reference-data.spec.ts` scans all inventory TypeScript files with `/(?:systemKey:\s*|BySystemKey\(\s*)'([A-Z_]+)'/g`, so it classified the invalid fixture as a production status lookup and reported `NOT_A_STATUS_KEY` as unshipped.

Fix: changed only invalid fixture value at `status.controller.spec.ts:243` to `systemKey: 'not_a_status_key'`. `@IsEnum(InventoryStatusKey)` still rejects this value; lowercase text does not match scanner's `[A-Z_]+` capture.

## Verification

Status controller spec, run first:

```text
(node:11396) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        1.155 s
Ran all test suites matching src/inventory/reference-data/status/presentation/status.controller.spec.ts.
```

Green command:

```bash
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory --runInBand
```

## Final Result After Fixture Fix

Green result:

Exit status: `0`

```text
(node:4088) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
[Nest] 4088  - 09/14/2026, 12:46:44 PM   ERROR [HttpIdentityAdapter] identity-service request failed or timed out
[Nest] 4088  - 09/14/2026, 12:46:44 PM   ERROR [HttpIdentityAdapter] identity-service answered 503
[Nest] 4088  - 09/14/2026, 12:46:44 PM   ERROR [HttpIdentityAdapter] identity-service request failed or timed out

Test Suites: 50 passed, 50 total
Tests:       266 passed, 266 total
Snapshots:   0 total
Time:        15.642 s
Ran all test suites matching inventory.
```

## Review Resolution

T025 review resolved the false reference by changing only the invalid fixture
from `NOT_A_STATUS_KEY` to lowercase `not_a_status_key`. The exact
`@IsEnum(InventoryStatusKey)` validation assertion remains unchanged. No
production lookup or migration data required a change.

Residual scanner fixture sensitivity: the source scanner reads all inventory
TypeScript and matches uppercase literals in `systemKey: '...'` and
`BySystemKey('...')`. Future invalid fixtures using that shape can become
false production references and must avoid the scanner pattern or trigger a
separately reviewed scanner change.
