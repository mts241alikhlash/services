# T013-T021 Report

## Status

Complete. Added characterization and contract tests for all nine controllers in US1 T013-T021. Production code, DTOs, modules, package files, schema, and planning documents were not modified.

## Files Changed

- `src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts`
- `src/inventory/reference-data/location/presentation/location.controller.spec.ts`
- `src/inventory/reference-data/status/presentation/status.controller.spec.ts`
- `src/inventory/asset/presentation/asset.controller.spec.ts`
- `src/inventory/asset/presentation/asset-unit.controller.spec.ts`
- `src/inventory/circulation/presentation/loan.controller.spec.ts`
- `src/inventory/circulation/presentation/history.controller.spec.ts`
- `src/inventory/approval/presentation/approval.controller.spec.ts`
- `src/inventory/approval/presentation/workflow.controller.spec.ts`
- `.superpowers/sdd/003-inventory-service-migration/task-013-021-report.md`

## Coverage Added

### T013 Funding source

- Delegation for list query, create body, update ID/body, and delete ID.
- Returned response forwarding for list, create, and update.
- Current path `inventory/funding-sources`.
- GET, POST, PATCH, and DELETE method metadata.
- Read, create, update, and delete permission metadata.
- Class `JwtAuthGuard`, bearer, tag, and response Swagger metadata.
- Create/update DTO validation through `ValidationPipe`.
- UUID pipe metadata and rejection for update/delete IDs.
- Effective 200, 201, 200, and 204 statuses.
- Permission denial through `PermissionGuard`.

### T014 Location

- Delegation and returned response forwarding for list, create, and update.
- Delete delegation and no-content behavior.
- Current path `inventory/locations`.
- GET, POST, PATCH, and DELETE methods and reference-data permissions.
- Create/update DTO validation and UUID rejection for update/delete IDs.
- Effective 200, 201, 200, and 204 statuses.

### T015 Status

- Delegation and returned response forwarding for list, create, and update.
- Delete delegation and no-content behavior.
- Current path `inventory/statuses`.
- GET, POST, PATCH, and DELETE methods and reference-data permissions.
- Create/update DTO validation, including boolean validation, and UUID rejection for update/delete IDs.
- Effective 200, 201, 200, and 204 statuses.

### T016 Asset

- Delegation and response forwarding for list, detail, create, add-units, and update.
- Delete delegation and no-content behavior.
- Current path `inventory/assets`.
- GET detail/list, POST create/add-units, PATCH update, and DELETE methods.
- Asset read/create/update/delete permissions.
- Class `JwtAuthGuard` metadata.
- Create asset, create units, and update asset validation.
- UUID pipe metadata and rejection for detail, add-units, update, and delete IDs.
- Effective 200, 201, 200, and 204 statuses.
- Permission denial through `PermissionGuard`.

### T017 Asset unit

- Lendable/search/pagination query forwarding.
- Update body and delete ID forwarding.
- Returned response forwarding and no-content delete behavior.
- Current path `inventory/asset-units`.
- GET, PATCH, and DELETE methods.
- Asset read/update/delete permissions.
- Class `JwtAuthGuard` metadata.
- Query and update DTO validation.
- UUID pipe metadata and rejection for update/delete IDs.
- Effective 200, 200, and 204 statuses.
- Permission denial through `PermissionGuard`.

### T018 Loan

- Loan list query forwarding, including pagination, keyword, status, and requester filters.
- Loan detail ID forwarding.
- Create body and current-user ID forwarding.
- Return body, loan ID, and current-user ID forwarding.
- Returned response forwarding.
- Current path `inventory/loans`.
- GET list/detail and POST create/return methods.
- Loan read/create/update permissions.
- Class `JwtAuthGuard` metadata.
- Create/return/query DTO validation.
- UUID pipe metadata and rejection for detail/return IDs.
- Effective 200, 200, 201, and explicit 200 statuses.
- Permission denial through `PermissionGuard`.

### T019 History

- History pagination and unit ID query forwarding.
- Returned response forwarding.
- Current path `inventory/histories`.
- GET method, loan-read permission, class `JwtAuthGuard`, and effective 200 status.
- Pagination and unit UUID query validation.
- Permission denial through `PermissionGuard`.

### T020 Approval

- Pending approval role forwarding from current user.
- Approval ID, action body, user ID, and user roles forwarding.
- Returned response forwarding.
- Current path `inventory/approvals`.
- GET pending and POST action methods.
- Approval read/update permissions.
- Class `JwtAuthGuard` metadata.
- Action enum/boolean validation.
- UUID pipe metadata and rejection for action ID.
- Effective 200 statuses, including explicit action status.
- Permission denial through `PermissionGuard`.

### T021 Workflow

- Workflow list, detail ID, and create body forwarding.
- Returned response forwarding.
- Current path `inventory/workflows`.
- GET list/detail and POST create methods.
- Approval read/create permissions.
- Class `JwtAuthGuard` metadata.
- Workflow nested body validation.
- UUID pipe metadata and rejection for detail ID.
- Effective 200, 200, and 201 statuses.
- Permission denial through `PermissionGuard`.

## Commands and Results

### Initial focused test run

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns="inventory/(reference-data/(funding-source|location|status)/presentation|asset/presentation|circulation/presentation|approval/presentation)/(funding-source|location|status|asset|asset-unit|loan|history|approval|workflow)\.controller\.spec\.ts" --runInBand
```

Result:

```text
Test Suites: 9 passed, 9 total
Tests:       40 passed, 40 total
Snapshots:   0 total
```

The new tests did not produce an expected red result. They passed against current production behavior. No syntax or setup failure occurred, and no production/test gap required correction.

### All controller specs

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=controller --runInBand
```

Result:

```text
Test Suites: 11 passed, 11 total
Tests:       52 passed, 52 total
Snapshots:   0 total
```

### Formatting

Command:

```text
pnpm exec prettier --check "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts"
```

Result:

```text
All matched files use Prettier code style!
```

### Git metadata check

Commands:

```text
git status --short
git diff --stat -- ...
```

Result:

```text
fatal: not a git repository (or any of the parent directories): .git
```

No commit was created.

## Concerns

- Jest emitted Node's existing `ExperimentalWarning` for `--experimental-vm-modules`; tests still passed.
- Asset, asset-unit, loan, history, approval, and workflow controllers currently expose no `@ApiResponse` metadata. Tests cover their observable method/status behavior without adding production Swagger metadata.
- The requested focused controller run and all existing controller specs pass. Full `pnpm run validate` was not run because task scope requested focused controller verification only.

## Review Fix Evidence

Applied review findings from `task-013-021-review.md`. Modified only the nine
T013-T021 controller spec files and this report. No production files, DTOs,
modules, package files, schema, planning documents, or `tasks.md` were changed.

- Added handler `PATH_METADATA` assertions for every route, including `:id`,
  `:id/units`, `:id/return`, and `:id/action`.
- Added production `PARAMTYPES_METADATA` assertions before validation checks.
- Matched global `ValidationPipe` options: `whitelist`,
  `forbidNonWhitelisted`, `transform`, and implicit conversion.
- Added `AssetQueryDto` coverage and reviewer-listed DTO checks for funding
  source limits, location limits, status system keys, asset-unit lendable
  transformation, loan requester UUID, and nested workflow validation.
- Permission tests now assert `ForbiddenException` and status `403`; location
  and status denial tests were added.
- Direct controller calls now use valid UUIDs where route UUID pipes apply.
- Broad exception assertions were replaced in changed specs with exact
  `BadRequestException` assertions. Existing category and condition baseline
  specs were not changed.

### Fix Verification

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns="inventory/(reference-data/(funding-source|location|status)/presentation|asset/presentation|circulation/presentation|approval/presentation)/(funding-source|location|status|asset|asset-unit|loan|history|approval|workflow)\.controller\.spec\.ts" --runInBand
```

Result:

```text
Test Suites: 9 passed, 9 total
Tests:       43 passed, 43 total
Snapshots:   0 total
```

Command:

```text
pnpm exec prettier --check "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts"
```

Result: `All matched files use Prettier code style!`

Command:

```text
pnpm exec eslint "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts" --max-warnings=0
```

Result: exit `0`, no output.

Command:

```text
pnpm exec eslint -c eslint.typecheck.config.mjs "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts" --max-warnings=0
```

Result: exit `0`, no output.

Git metadata remains absent, so changed-file scope was verified by inspection,
not by `git diff`.

## Review Fix Round 2 Evidence

Applied `task-013-021-review.md` guard and Swagger findings. Modified only the
nine T013-T021 controller spec files and this report. No production, package,
schema, planning, or task files were modified.

- Added exact class-level `GUARDS_METADATA` assertions for `JwtAuthGuard` in
  all nine controller specs.
- Added exact `ApiTags`, `ApiBearerAuth`, and `ApiOperation` assertions for
  every controller, matching decorators present in production.
- Added `ApiResponse` assertions only to funding-source, location, and status,
  where production controllers declare `@ApiResponse`.

### Round 2 Verification

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns="inventory/(reference-data/(funding-source|location|status)/presentation|asset/presentation|circulation/presentation|approval/presentation)/(funding-source|location|status|asset|asset-unit|loan|history|approval|workflow)\.controller\.spec\.ts" --runInBand
```

Result:

```text
Test Suites: 9 passed, 9 total
Tests:       53 passed, 53 total
Snapshots:   0 total
```

Command:

```text
pnpm exec prettier --write "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts"
```

Result: exit `0`; all nine files formatted, with unchanged files reported as
unchanged.

Command:

```text
pnpm exec eslint "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts" --max-warnings=0
```

Result: exit `0`, no output.

Command:

```text
pnpm exec eslint -c eslint.typecheck.config.mjs "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts" --max-warnings=0
```

Result: exit `0`, no output.

Node emitted existing `ExperimentalWarning` for `--experimental-vm-modules`.
Git metadata remains absent; no commit was created.

## Remaining Typed Fixture Fix

`CreateAssetDto` requires `purchaseDate`, `purchasePrice`, `locationId`,
`statusId`, and `conditionId`. Added valid values for those fields to the
`createInput` fixture in `asset.controller.spec.ts`. No production or planning
files were modified.

### Final Verification

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns="inventory/(reference-data/(funding-source|location|status)/presentation|asset/presentation|circulation/presentation|approval/presentation)/(funding-source|location|status|asset|asset-unit|loan|history|approval|workflow)\.controller\.spec\.ts" --runInBand
```

Result:

```text
(node:7088) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

Test Suites: 9 passed, 9 total
Tests:       53 passed, 53 total
Snapshots:   0 total
Time:        13.74 s
Ran all test suites matching inventory/(reference-data/(funding-source|location|status)/presentation|asset/presentation|circulation/presentation|approval/presentation)/(funding-source|location|status|asset|asset-unit|loan|history|approval|workflow)\.controller\.spec\.ts.
```

Command:

```text
pnpm exec prettier --check "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts"
```

Result:

```text
Checking formatting...
All matched files use Prettier code style!
```

Command:

```text
pnpm exec eslint "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts" --max-warnings=0
```

Result: exit `0`, no output.

Command:

```text
pnpm exec eslint -c eslint.typecheck.config.mjs "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts" --max-warnings=0
```

Result: exit `0`, no output.

Command:

```text
pnpm run typecheck
```

Result:

```text
$ tsc --noEmit
```

## Final Review Findings Fix

- Replaced broad validation exception checks in all nine controller specs with
  exact `BadRequestException`, HTTP `400`, and `{ statusCode, error, message }`
  response-shape assertions. Validation messages remain array-shaped without
  inventing validator text.
- Replaced broad UUID exception checks with exact `BadRequestException`, HTTP
  `400`, and Nest's stable UUID message assertion.
- Removed duplicate Swagger assertion blocks from location and status specs;
  each retains one complete block.
- Modified test files only and this report. No production, package, schema,
  planning, or task files were modified.

### Final Review Verification

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns="inventory/(reference-data/(funding-source|location|status)/presentation|asset/presentation|circulation/presentation|approval/presentation)/(funding-source|location|status|asset|asset-unit|loan|history|approval|workflow)\.controller\.spec\.ts" --runInBand
```

Result:

```text
(node:6860) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

Test Suites: 9 passed, 9 total
Tests:       51 passed, 51 total
Snapshots:   0 total
Time:        5.861 s
Ran all test suites matching inventory/(reference-data/(funding-source|location|status)/presentation|asset/presentation|circulation/presentation|approval/presentation)/(funding-source|location|status|asset|asset-unit|loan|history|approval|workflow)\.controller\.spec\.ts.
```

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=controller --runInBand
```

Result:

```text
(node:10972) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

Test Suites: 11 passed, 11 total
Tests:       63 passed, 63 total
Snapshots:   0 total
Time:        13.921 s
Ran all test suites matching controller.
```

Command:

```text
pnpm exec prettier --check "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts"
```

Result:

```text
Checking formatting...
All matched files use Prettier code style!
```

Command:

```text
pnpm exec eslint "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts" --max-warnings=0
```

Result: exit `0`, no output.

Command:

```text
pnpm exec eslint -c eslint.typecheck.config.mjs "src/inventory/reference-data/funding-source/presentation/funding-source.controller.spec.ts" "src/inventory/reference-data/location/presentation/location.controller.spec.ts" "src/inventory/reference-data/status/presentation/status.controller.spec.ts" "src/inventory/asset/presentation/asset.controller.spec.ts" "src/inventory/asset/presentation/asset-unit.controller.spec.ts" "src/inventory/circulation/presentation/loan.controller.spec.ts" "src/inventory/circulation/presentation/history.controller.spec.ts" "src/inventory/approval/presentation/approval.controller.spec.ts" "src/inventory/approval/presentation/workflow.controller.spec.ts" --max-warnings=0
```

Result: exit `0`, no output.

Command:

```text
pnpm run typecheck
```

Result:

```text
$ tsc --noEmit
```
