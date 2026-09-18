# T031 Report

Date: 2026-09-14
Task: T031, US2 funding-source HTTP presentation
Status: COMPLETE

## Scope

- Moved `FundingSourceController` and its characterization spec into `src/inventory/reference-data/funding-source/presentation/http/`.
- Moved funding-source request DTOs into `presentation/http/dto/request/`.
- Moved the funding-source response DTO into `presentation/http/dto/response/`.
- Preserved controller routes, methods, permissions, guards, Swagger tags, bearer metadata, operation summaries, `ParseUUIDPipe`, `ValidationPipe` compatibility, response values, and status codes.
- Preserved application input mapping: query search, create body, update ID/body, and delete ID forwarding remain unchanged.
- Updated only required imports in `funding-source.module.ts` and `reference-data/dto/response/metadata-response.dto.ts`.
- Removed old funding-source presentation and DTO paths by moving existing files.
- No application, domain, infrastructure behavior, schema, package, planning, or task changes. No subagents. No commit.

## Focused Tests

Controller characterization command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/reference-data/funding-source/presentation/http/funding-source.controller.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
exit code: 0
```

Funding-source suite:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=funding-source --runInBand
Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
exit code: 0
```

Application boot:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/app.module.boots.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
exit code: 0
```

## Verification

Targeted T031 files pass Prettier:

```text
pnpm exec prettier --check "src/inventory/reference-data/funding-source/presentation/http/**/*.ts" "src/inventory/reference-data/funding-source/funding-source.module.ts" "src/inventory/reference-data/dto/response/metadata-response.dto.ts"
All matched files use Prettier code style!
exit code: 0
```

Repository checks:

```text
pnpm run lint
exit code: 0

pnpm run lint:strict
exit code: 0

pnpm run typecheck
exit code: 0
```

Repository-wide Prettier remains blocked by unrelated pre-existing formatting debt:

```text
pnpm run format:check
src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts
Code style issues found in the above file.
exit code: 1
```

## Review Fix

- Corrected the earlier report overclaim: the moved controller initially lacked two Swagger decorators, so response/query metadata was not fully preserved at first review.
- Added `@ApiQuery({ name: 'search', required: false })` to `getFundingSources`.
- Added `@ApiResponse({ status: HttpStatus.NO_CONTENT })` to `deleteFundingSource`.
- Extended the characterization spec to assert `DECORATORS.API_PARAMETERS` query metadata and `DECORATORS.API_RESPONSE` status `204` metadata.
- Pre-move generated controller output was read as evidence only; generated artifacts were not changed.

Review-fix verification:

```text
Controller characterization: 1 suite passed, 6 tests passed.
Funding-source suite: 2 suites passed, 12 tests passed.
Application boot: 1 suite passed, 1 test passed.
Targeted Prettier: passed.
ESLint: passed.
Strict ESLint: passed.
Typecheck: passed.
```

Stale funding-source import scan returned no source matches.
