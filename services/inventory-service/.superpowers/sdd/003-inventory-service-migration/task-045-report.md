# T045 Report

## Scope

Executed T045 only. No schema, package, planning, or task changes.

## Coverage

- Use cases: existing `status-use-cases.spec.ts` covers explicit create/update mapping, defaults, search forwarding, not-found errors, protected system-key deletion, and unprotected deletion.
- Repository port: existing `status.repository.spec.ts` covers explicit output fields, nullable `systemKey`, enum typing, and exclusion of stale fields.
- Prisma repository: added `prisma-status.repository.spec.ts` covering case-insensitive code/name search, ascending name order, Prisma/domain enum mapping across all six `InventoryStatusKey` values, explicit create/update mapping, missing-id lookup, and database error propagation for lookup and mutations.
- Controller: existing `status.controller.spec.ts` covers delegation, routes, permissions, HTTP statuses, guards, Swagger metadata including explicit DELETE 204 metadata, response enum metadata, validation, UUID pipes, and valid system-key input.
- Module wiring: existing `status.module.spec.ts` covers `IStatusRepository` resolving to `PrismaStatusRepository`.

## Contract Review

No speculative status system-key lookup exists. Circulation and approval retain their existing `findStatusBySystemKey` methods; no status-module consumer calls a status-port equivalent.

Status adapter maps all six Prisma enum values to domain `InventoryStatusKey` values and maps domain enum inputs explicitly for create and update.

## Cleanup

Removed only verified-empty, unreferenced legacy directories:

- `src/inventory/reference-data/status/dto/request/`
- `src/inventory/reference-data/status/dto/response/`
- `src/inventory/reference-data/status/domain/interfaces/`
- `src/inventory/reference-data/status/use-cases/`

## Verification

Command:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=src/inventory/reference-data/status --runInBand
```

Result: 5 test suites passed, 24 tests passed.

Deferred by task instruction: lint, format, typecheck, and build.
