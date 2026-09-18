# T057 Report

## Status

T057 complete.

## Scope

Moved circulation HTTP presentation files into:

- `src/inventory/circulation/presentation/http/loan.controller.ts`
- `src/inventory/circulation/presentation/http/history.controller.ts`
- `src/inventory/circulation/presentation/http/loan.controller.spec.ts`
- `src/inventory/circulation/presentation/http/history.controller.spec.ts`
- `src/inventory/circulation/presentation/http/dto/request/create-loan.dto.ts`
- `src/inventory/circulation/presentation/http/dto/request/loan-query.dto.ts`
- `src/inventory/circulation/presentation/http/dto/request/history-query.dto.ts`
- `src/inventory/circulation/presentation/http/dto/request/return-loan.dto.ts`

No circulation response DTOs existed before T057, so none were invented. Existing
use-case return values and response envelopes remain forwarded unchanged.

## Preserved HTTP Contract

- Loan routes remain `GET /inventory/loans`, `GET /inventory/loans/:id`,
  `POST /inventory/loans`, and `POST /inventory/loans/:id/return`.
- History route remains `GET /inventory/histories`.
- HTTP methods, guards, permission codes, UUID pipes, validation decorators,
  Swagger tags, operations, query metadata, parameter metadata, and response
  statuses remain unchanged, including `200 OK` for loan return.
- DTOs remain HTTP-only under `presentation/http/dto/request/`.
- Controllers import application use cases and platform HTTP/auth concerns only;
  no Prisma or domain imports were added.
- `circulation.module.ts` changes only controller import paths. Module tokens and
  `src/inventory/circulation/index.ts` public exports remain unchanged for T058.

## Verification

Command run from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/circulation --runInBand
Test Suites: 8 passed, 8 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Time:        6.137 s
Ran all test suites matching inventory/circulation.
```

Static path checks:

- Eight HTTP presentation files found under `presentation/http`, including four
  request DTOs and both controller specs.
- No files remain under `src/inventory/circulation/dto/`.
- No files remain directly under `src/inventory/circulation/presentation/`.
- No Prisma or `PrismaService` imports found under the moved HTTP presentation.
- No old circulation DTO/controller import paths remain.

## Corrective Review

T057 presentation files remain unchanged. HTTP continues forwarding enriched
plain repository outputs without DTO or Prisma imports.

No schema or package changes were made. No subagents used. No commit created.
