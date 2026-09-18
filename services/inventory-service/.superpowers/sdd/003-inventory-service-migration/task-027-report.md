# T027 Report: Public HTTP Contract Reconciliation

Date: 2026-09-14
Task: T027, US1 characterization review
Status: PARTIAL CONTRACT EVIDENCE

## Scope

Compared `specs/003-inventory-service-migration/contracts/public-http.md` with
characterization tests and reports under:

- `src/inventory/reference-data/`
- `src/inventory/asset/`
- `src/inventory/circulation/`
- `src/inventory/approval/`
- `.superpowers/sdd/003-inventory-service-migration/task-013-021-report.md`
- `.superpowers/sdd/003-inventory-service-migration/task-022-report.md`
- `.superpowers/sdd/003-inventory-service-migration/task-023-report.md`
- `.superpowers/sdd/003-inventory-service-migration/task-024-report.md`
- `.superpowers/sdd/003-inventory-service-migration/task-025-report.md`
- `.superpowers/sdd/003-inventory-service-migration/task-026-report.md`

Only this report and `contracts/public-http.md` were changed. Source, tests,
tasks, package files, and schema were not changed. No subagents were used. No
commit was created.

## Exact Matches

- All 40 documented route paths and methods match controller metadata, the
  category and condition controller specs, metadata controller source/spec, and
  the T013-T021 report, including nested `:id/units`, `:id/return`, and
  `:id/action` routes.
- All documented permission codes match `@RequirePermissions` metadata and
  characterization assertions.
- All covered controllers retain `JwtAuthGuard`; permission denial checks prove
  `PermissionGuard` throws HTTP 403 for missing permissions at unit level.
- Request DTO metatypes match the contract for reference-data bodies, asset and
  asset-unit query/body inputs, loan/history inputs, workflow creation, and
  approval action.
- Validation evidence matches documented rules for required values, length and
  numeric bounds where checked, positive pagination, UUID fields, nested arrays,
  status enum, booleans, and global whitelist/forbid-non-whitelisted options.
- Source-grounded fact: every documented path ID uses `ParseUUIDPipe`. Asset,
  circulation, approval, funding-source, location, and status specs assert invalid
  IDs return `BadRequestException` with HTTP 400. Category and condition specs
  assert invalid IDs are rejected through `ParseUUIDPipe`, but do not assert HTTP
  400.
- Success statuses match: create POST 201, loan return and approval action 200,
  delete 204, and other documented GET/PATCH handlers 200.
- Query forwarding matches for reference-data search, asset filters, asset-unit
  lendable/search filters, loan filters, and history pagination/unit filters.
- Use-case characterization matches documented not-found behavior for asset,
  asset-unit, loan, workflow, approval instance, and missing asset parent cases,
  including current exception messages and tested short-circuit behavior.
- T026 observed authorized metadata 200, no-bearer 401, invalid input 400,
  unknown asset ID 404, and empty category result 200. Executed success/error
  responses used the documented envelope shape where recorded.

## Mismatches

No contract mismatch found.

No route, method, permission, DTO wiring, validation, UUID, response status,
query-forwarding, or characterized not-found mismatch was found.

## Evidence Gaps

- Category and condition controller specs do not independently assert returned
  response identity, HTTP 400 for invalid UUIDs, or every global validation-pipe
  option.
- Metadata controller source and `get-metadata.use-case.spec.ts` confirm
  `GET /inventory/metadata`, read permission, `JwtAuthGuard`, response DTO, and
  use-case delegation. No metadata controller characterization spec exists.
- Controller specs mock response values and therefore do not prove the global
  `ResponseInterceptor` envelope for every route. T026 plus core interceptor
  tests provide partial envelope evidence.
- Characterization suites do not provide a complete HTTP exercise of every
  `HttpExceptionFilter` Prisma mapping, 5xx environment shape, or repository
  failure route.

These are evidence limitations, not observed contract mismatches.

## T026 Carried Blockers

T026 is **PARTIAL EVIDENCE**. T026 did not execute:

- HTTP 403 for missing route permission, because no safe non-`SUPER_ADMIN`
  credential was available.
- HTTP 503 for identity-service failure, because stopping or overriding the
  shared identity-service was not authorized.

Controller tests prove unit-level permission denial as 403, and identity adapter
tests prove failure mapping as 503. Neither substitutes for missing end-to-end
smoke evidence. This report does not claim full contract verification.

## Verification

Review evidence came from the existing characterization files and reports. No
source or test command was required because T027 changes documentation only.
The two changed files are:

- `specs/003-inventory-service-migration/contracts/public-http.md`
- `.superpowers/sdd/003-inventory-service-migration/task-027-report.md`

## Fix Evidence

- Corrected UUID wording to distinguish source-grounded `ParseUUIDPipe` usage,
  HTTP 400 assertions in six controller specs, and rejection-only assertions in
  category and condition specs.
- Expanded route evidence citations to include category controller spec,
  condition controller spec, metadata controller source/spec, and T013-T021
  reports for all 40 routes.
- Preserved partial envelope evidence and unexecuted T026 HTTP 403 and 503
  scenarios. Git verification remains absent because `inventory-service` is not a
  Git repository.
- Prettier command: `pnpm exec prettier --check "specs/003-inventory-service-migration/contracts/public-http.md" ".superpowers/sdd/003-inventory-service-migration/task-027-report.md"`
- Prettier result: PASS, both changed Markdown files use Prettier code style.
- Scope result: only `public-http.md` and `task-027-report.md` changed; no source,
  tests, tasks, package, schema, or `tasks.md` changes; no commit.
