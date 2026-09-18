# Quickstart: Inventory Service Migration

## Preconditions

```bash
cd inventory-service
pnpm install
pnpm prisma:generate
```

No database is required for isolated use-case and boundary tests. Live HTTP
smoke tests require inventory-service and its database. Identity-dependent
smoke tests also require identity-service.

## Wave 0 Baseline

Captured 2026-09-14 from `inventory-service`. No source, package, schema, or
task file changed during baseline commands.

### T006: Prisma client generation

Command:

```bash
pnpm prisma:generate
```

Fresh output:

```text
$ prisma generate
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma.

┌─────────────────────────────────────────────────────────┐
│ Update available 7.10.0 -> 8.0.0-rc.14                 │
│                                                         │
│ This is a major update - please follow the guide at    │
│ https://pris.ly/d/major-version-upgrade                │
│                                                         │
│ Run the following to update                            │
│   npm i --save-dev prisma@latest                       │
│   npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

✔ Generated Prisma Client (v7.10.0) to .\node_modules\.pnpm\@prisma+client@7.10.0_prism_af9cc47cce5671f9c5797a0d26ea401c\node_modules\@prisma\client in 213ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
```

Exit status: 0. Generated client prerequisite is current for the checked
schema. The command reports Prisma Client v7.10.0, while `package.json`
declares `@prisma/client` and `prisma` as `^7.9.1`; the resolved installed
version is the version used by this baseline.

### T004: Full validation

Command:

```bash
pnpm run validate
```

Script chain from `package.json`:

```text
pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run lint:strict && pnpm test && pnpm run build
```

Fresh output:

```text
$ pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run lint:strict && pnpm test && pnpm run build
$ prettier --check "src/**/*.ts"
Checking formatting...
All matched files use Prettier code style!
$ eslint "src/**/*.ts" --max-warnings=0
$ tsc --noEmit
$ eslint -c eslint.typecheck.config.mjs "src/**/*.ts" --max-warnings=0
$ cross-env NODE_OPTIONS=--experimental-vm-modules jest --passWithNoTests
(node:<pid>) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:<pid>) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:<pid>) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(Nest) [HttpIdentityAdapter] identity-service request failed or timed out
(Nest) [HttpIdentityAdapter] identity-service answered 503
(Nest) [HttpIdentityAdapter] identity-service request failed or timed out
Test Suites: 23 passed, 23 total
Tests:       142 passed, 142 total
Snapshots:   0 total
Time:        7.302 s
Ran all test suites.
$ nest build
```

Exit status: 0. Format check, lint, typecheck, strict lint, Jest, and build
all completed. Jest reported 23 suites and 142 tests, all passing. Output
included one Node experimental VM-modules warning group and three expected
identity adapter error logs from identity-service failure-path tests. No Jest
test failure was reported.

## Existing Checks

Use the ESM-safe Jest command:

```bash
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=reference-data/condition --runInBand
```

Replace the path with the active module or boundary. Run characterization
tests before moving untested circulation code.

Static review searches `src/inventory/` and checks:

- every module uses the target layer names where migration is complete;
- domain and application contain no Prisma or HTTP DTO imports;
- only Prisma infrastructure imports `@prisma/client` or `PrismaService`;
- no repository queries a model outside its ownership matrix;
- no query over a soft-deletable model omits `deletedAt: null`;
- no period-bound query reads across periods or filters after a wide read;
- no authorization bypass exists outside `PermissionGuard`;
- no obsolete old-layout imports remain.

## Wave Gate

Each wave must pass focused tests, typecheck, lint, strict lint, and scoped
review. Final program gate:

```bash
pnpm run validate
```

## HTTP Smoke Scenarios

For each affected area, verify authorized success, invalid input, missing
permission, unknown ID, empty result, and identity-service failure behavior
where relevant. Approval waves additionally verify reject, next-step approval,
final approval, retry, and downstream failure repair behavior.

## T025: US1 Characterization Suites

Captured 2026-09-14 from `inventory-service`. The T025 fixture fix changed only
`src/inventory/reference-data/status/presentation/status.controller.spec.ts`.
No production, schema, or package files changed. This reconciliation changes
T025 records only.

Command:

```bash
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory --runInBand
```

Initial result before fixture fix:

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

(node:11412) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
\x1b[31m[Nest] 11412  - \x1b[39m09/14/2026, 12:39:04 PM \x1b[31m  ERROR\x1b[39m \x1b[38;5;3m[HttpIdentityAdapter]\x1b[39m \x1b[31midentity-service request failed or timed out\x1b[39m
\x1b[31m[Nest] 11412  - \x1b[39m09/14/2026, 12:39:04 PM \x1b[31m  ERROR\x1b[39m \x1b[38;5;3m[HttpIdentityAdapter]\x1b[39m \x1b[31midentity-service answered 503\x1b[39m
\x1b[31m[Nest] 11412  - \x1b[39m09/14/2026, 12:39:04 PM \x1b[31m  ERROR\x1b[39m \x1b[38;5;3m[HttpIdentityAdapter]\x1b[39m \x1b[31midentity-service request failed or timed out\x1b[39m

Summary of all failing tests
FAIL inventory/shared/domain/inventory-reference-data.spec.ts
  ● inventory reference data exists for every code the source asks for › ships a status for every system role the code looks up

Test Suites: 1 failed, 49 passed, 50 total
Tests:       1 failed, 265 passed, 266 total
Snapshots:   0 total
Time:        16.904 s, estimated 21 s
Ran all test suites matching inventory.
```

Exit status: 1. One suite failed and 49 passed. One test failed and 265
passed. Jest emitted one Node experimental VM-modules warning. Nest emitted
three `HttpIdentityAdapter` error logs: two identity-service
failure/timeout messages and one `identity-service answered 503` message.

Root cause and fix: `status.controller.spec.ts:243` used the intentional
invalid-input fixture `systemKey: 'NOT_A_STATUS_KEY'`. The source scan in
`inventory-reference-data.spec.ts` scans all inventory TypeScript files and
treated this uppercase fixture as a referenced production status key, then
found no matching migration row. The fixture changed to
`systemKey: 'not_a_status_key'`. `@IsEnum(InventoryStatusKey)` still rejects
the value, and lowercase text does not match the scanner's `[A-Z_]+` capture.

Final result after fixture fix:

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

Exit status: 0. T025 review resolution: the false reference came from the
invalid status fixture, not production lookup code. The lowercase fixture
preserves the exact validation assertion and removes the false scanner match.

Residual scanner fixture sensitivity: the scanner reads all inventory
TypeScript and can classify uppercase string literals matching
`systemKey: '...'` or `BySystemKey('...')` as production references. Future
invalid status fixtures must avoid that scanner shape unless the scanner is
separately changed and reviewed.

## T026: HTTP Smoke Scenarios

Captured 2026-09-14 from the existing local configuration. No environment,
schema, package, or source file changed. `inventory-service` ran transiently
with `pnpm start` on port 3300 and was stopped after requests completed.

### Prerequisite checks

Commands:

```text
powershell -NoProfile -Command "$ports = 3000,3300,5433; foreach ($p in $ports) { $r = Test-NetConnection -ComputerName 127.0.0.1 -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue; Write-Output ('127.0.0.1:' + $p + ' listening=' + $r) }"
pnpm prisma migrate status
curl.exe -sS -i --max-time 5 http://localhost:3000/health
```

Results:

```text
127.0.0.1:3000 listening=True
127.0.0.1:3300 listening=False
127.0.0.1:5433 listening=True

Database schema is up to date!

HTTP/1.1 200 OK
{"statusCode":200,"message":"Success","data":{"status":"ok","info":{"database":{"status":"up"},"memory_heap":{"status":"up"}},"error":{},"details":{"database":{"status":"up"},"memory_heap":{"status":"up"}}}
```

Inventory `.env` already configured `PORT=3300`, the database at
`localhost:5433/inventory_service`, and identity at `http://localhost:3000`.
The existing identity health endpoint and inventory database were available.

### Smoke commands

The transient runner used `python` with the webapp-testing `with_server.py`
helper:

```text
python "C:\Users\VaalLz\.agents\skills\webapp-testing\scripts\with_server.py" --server "pnpm start" --port 3300 --timeout 60 -- node -e "<Node fetch script below>"
```

The Node fetch script sent these exact requests, in this order:

```text
POST http://127.0.0.1:3000/auth/login
GET  http://127.0.0.1:3300/inventory/metadata        Authorization: Bearer <in-memory access token>
GET  http://127.0.0.1:3300/inventory/metadata
GET  http://127.0.0.1:3300/inventory/assets?page=0   Authorization: Bearer <in-memory access token>
GET  http://127.0.0.1:3300/inventory/assets/00000000-0000-0000-0000-000000000000  Authorization: Bearer <in-memory access token>
GET  http://127.0.0.1:3300/inventory/categories?search=__T026_NO_MATCH_9f6b2c__  Authorization: Bearer <in-memory access token>
```

The login body was `{"identifier":"admin","password":"<existing seeded
admin password>"}`. Login used existing workspace-seeded `admin` credentials
from `identity-service/prisma/seed-admin-minimal.ts`; the access token was held
in memory and not recorded. The process was stopped after requests completed.

### Results

| Scenario                    | Request                                                                                             | Result | Evidence                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------- | -----: | --------------------------------------------------------------------------------------------------------- |
| Authorized                  | `POST http://127.0.0.1:3000/auth/login` with existing `admin` credential                            |    200 | Response envelope contained `data.accessToken`; user role was `SUPER_ADMIN`.                              |
| Authorized success          | `GET http://127.0.0.1:3300/inventory/metadata` with bearer token                                    |    200 | `data` returned empty categories, locations, conditions, and funding sources, plus six seeded statuses.   |
| Unauthorized authentication | `GET http://127.0.0.1:3300/inventory/metadata` without bearer token                                 |    401 | `{"statusCode":401,"message":"Unauthorized","data":null}`                                                 |
| Invalid input               | `GET http://127.0.0.1:3300/inventory/assets?page=0` with bearer token                               |    400 | `{"statusCode":400,"message":["page must not be less than 1"],"data":null}`                               |
| Unknown ID                  | `GET http://127.0.0.1:3300/inventory/assets/00000000-0000-0000-0000-000000000000` with bearer token |    404 | `{"statusCode":404,"message":"Asset with ID 00000000-0000-0000-0000-000000000000 not found","data":null}` |
| Empty result                | `GET http://127.0.0.1:3300/inventory/categories?search=__T026_NO_MATCH_9f6b2c__` with bearer token  |    200 | `{"statusCode":200,"message":"Success","data":[]}`                                                        |

### Unexecuted scenarios

- Missing-permission `403`: no safe non-`SUPER_ADMIN` test credential was
  available in existing configuration. `401` missing-bearer behavior above is
  not substituted for `403`.
- Identity-service failure `503`: identity-service was healthy on configured
  `http://localhost:3000`. Not simulated because doing so would require
  stopping shared identity-service or overriding the existing process config,
  both outside this safe smoke run.

No create, update, delete, loan, return, workflow, or approval action was sent.

## Wave 6 Final Verification

Rechecked on 2026-09-16 from `inventory-service` after approval consequence
orchestration and asset persistence relocation.

### Focused suites

| Scope                                      | Suites | Tests | Result |
| ------------------------------------------ | -----: | ----: | ------ |
| `src/inventory/reference-data`             |     22 |   112 | PASS   |
| `src/inventory/asset`                      |     17 |    74 | PASS   |
| `src/inventory/circulation`                |      9 |    38 | PASS   |
| `src/inventory/approval`                   |      9 |    93 | PASS   |
| shared, composition, response, role-bypass |      6 |    31 | PASS   |

The full inventory total is not the sum of this table because scoped runs
overlap shared tests. Jest emitted only the known Node VM-modules warning.

### Static and budget checks

- No files remain directly under `src/inventory/**/infrastructure/persistence/`;
  Prisma adapters are under `infrastructure/persistence/prisma/`.
- No files remain under `src/inventory/**/domain/interfaces/` or old layouts in
  migrated business modules. The reference-data aggregate intentionally keeps
  `use-cases/`, `presentation/`, and `dto/` at aggregate level for metadata
  composition outside its five lookup modules.
- Domain and application production files contain no Prisma or HTTP DTO imports;
  presentation production files contain no Prisma imports.
- `SUPER_ADMIN` authorization bypass remains in
  `src/platform/access-control/permission/guards/permission.guard.ts` only.
- Repository class budgets pass. Largest counted classes: circulation 191 lines,
  approval 163 lines, and asset-unit 150 lines. The approval use case is 295
  counted lines. The asset-unit reader is 170 lines and its mapping companion is
  174 lines.
- Final asset ESLint, typecheck, and Prettier checks pass after the split.

### Final validation

Command:

```bash
pnpm run validate
```

Result:

```text
format:check PASS
lint PASS
lint:strict PASS
Test Suites: 71 passed, 71 total
Tests: 407 passed, 407 total
build PASS
```

Jest emitted three expected identity-service failure-path logs and the Node
experimental VM-modules warning. No test failure occurred.

### Follow-up Verification: 2026-09-16

The approved approval-state migration was applied to the configured local
database at `localhost:5433/inventory_service`.

| Command                                                                                                                                                                                                                                                                                | Result                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `pnpm exec prettier --check "docs/ARCHITECTURE.md" "specs/003-inventory-service-migration/data-model.md" "specs/003-inventory-service-migration/checklists/requirements.md" "specs/003-inventory-service-migration/research.md" "specs/003-inventory-service-migration/quickstart.md"` | PASS                                                                                              |
| `pnpm exec prisma validate`                                                                                                                                                                                                                                                            | PASS                                                                                              |
| `pnpm prisma:deploy`                                                                                                                                                                                                                                                                   | PASS, applied `20260915100000_approval_consequence_state`                                         |
| `pnpm prisma migrate status`                                                                                                                                                                                                                                                           | PASS, database schema is up to date                                                               |
| Safe HTTP smoke                                                                                                                                                                                                                                                                        | PASS, health `200`, missing bearer `401`, permission denial `403`, isolated identity outage `503` |
| `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --passWithNoTests --runInBand --detectOpenHandles`                                                                                                                                                                    | PASS, 71 suites / 407 tests; no open-handle report                                                |

The identity outage smoke started `inventory-service` with
`IDENTITY_SERVICE_URL=http://127.0.0.1:9` and sent an in-memory locally signed
access-shaped JWT. It did not stop or reconfigure the shared identity-service.
The permission-denial smoke used a temporary local identity stub returning a
`STAFF` identity with no permissions and sent another in-memory locally signed
access-shaped JWT. No credential or token was recorded.

The normal parallel Jest run emitted a worker teardown warning. The serial
`--detectOpenHandles` rerun completed without an open-handle report; only the
expected identity failure-path logging remained.

### Residual risks and blockers

- `prisma/migrations/20260915100000_approval_consequence_state/migration.sql`
  is applied to the configured local database and remains a separate deployment
  step for staging or production. Run `pnpm prisma:deploy` in each approved
  target environment before using approval consequence retry state there.
- Git metadata is absent, so no commit or Git-based diff review exists.
- Live identity-backed 403 smoke remains unexecuted because no non-admin
  credential was available. The route-level path was verified with the local
  identity stub above, and controller tests cover permission denial.
  Identity-service 503 is covered by the isolated outage smoke above and
  adapter tests.
- The five-minute approval consequence lease can block retry after a crashed
  worker for up to five minutes and permits retry if one consequence runs longer
  than the lease. Target-state writes and keyed history make retry safe.
- Asset-unit and circulation response projections are hydrated through public
  capability ports. Missing or soft-deleted related records retain existing
  omitted/null mapping semantics.
