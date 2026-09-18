# T043 Report

Date: 2026-09-14
Task: T043, US2 status HTTP presentation
Status: COMPLETE

## Scope

- Moved status request DTOs to `src/inventory/reference-data/status/presentation/http/dto/request/`.
- Moved status response DTO to `src/inventory/reference-data/status/presentation/http/dto/response/`.
- Moved `StatusController` and its focused spec to `src/inventory/reference-data/status/presentation/http/`.
- Preserved exact `inventory/statuses` routes, HTTP methods, guards, permissions, UUID pipes, validation decorators, enum behavior, application input forwarding, envelopes, and statuses.
- Restored optional `search` Swagger query metadata and DELETE `204` Swagger response metadata.
- Updated only required imports in the moved controller/spec, `status.module.ts`, metadata response DTO, and moved request DTO.
- Did not change module repository token, behavior, schema, package files, planning, or tasks. No subagents. No commit.
- Review fix: response DTO now imports shared domain `InventoryStatusKey`, not `@prisma/client`; Swagger enum metadata and runtime enum behavior remain aligned with request DTO and application contracts.
- T042 DI blocker remains: `status.module.ts` still uses old `IStatusRepository` interface token; T044 owns module-token rewiring.

## Tests

Focused status suite:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/status --runInBand
Test Suites: 3 passed, 3 total
Tests:       17 passed, 17 total
Snapshots:   0 total
exit code: 0
```

TDD red, focused controller test before enum import fix:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/status/presentation/http/status.controller.spec.ts --runInBand
Test Suites: 1 failed, 1 total
Tests:       1 failed, 7 passed, 8 total
Failure: response DTO Swagger enum metadata was Prisma enum array, not shared InventoryStatusKey enum object
```

TDD green, focused status suite after enum import fix:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/status --runInBand
Test Suites: 3 passed, 3 total
Tests:       18 passed, 18 total
Snapshots:   0 total
exit code: 0
```

## Verification

Focused moved HTTP and status module formatting:

```text
pnpm exec prettier --check "src/inventory/reference-data/status/presentation/http/**/*.ts" "src/inventory/reference-data/status/status.module.ts" "src/inventory/reference-data/dto/response/metadata-response.dto.ts"
All matched files use Prettier code style!
exit code: 0
```

Stale status presentation import scan under `src/`:

```text
No files found
```

Old status DTO directory scan:

```text
No files found
```
