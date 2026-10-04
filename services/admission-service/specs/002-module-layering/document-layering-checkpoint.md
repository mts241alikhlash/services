# Document Layering Checkpoint

## Scope

Completed `T007-T008`. Document upload and verification now use explicit
domain, application, infrastructure, and HTTP presentation boundaries.
Storage keys, allowed MIME types, 5 MB limit, editable-status guard, document
upsert behavior, verification validation, notification messages, permissions,
routes, response shapes, and persistence behavior remain unchanged.

## Exact Moves

- `document/domain/entities/admission-document.entity.ts` remains the document
  domain entity and now owns the document file reference type.
- New `document/domain/entities/admission-file.entity.ts` owns plain upload and
  stored-file boundary types.
- New `document/domain/repositories/admission-document-repository.ts` owns
  document type lookup, upload application lookup, document save, document read,
  and document status update contracts.
- New `document/domain/repositories/admission-document-notification.port.ts`
  owns the notification boundary used by document verification.
- New `document/domain/repositories/admission-file-storage.ts` owns the plain
  storage boundary used by upload use cases.
- New
  `document/application/use-cases/upload-admission-document/upload-admission-document.use-case.ts`
  owns upload validation and orchestration.
- New
  `document/application/use-cases/upload-admission-document/upload-admission-document.input.ts`
  contains the plain upload input.
- New
  `document/application/use-cases/verify-document/verify-document.use-case.ts`
  owns verification validation and orchestration.
- New
  `document/application/use-cases/verify-document/verify-document.input.ts`
  contains the plain verification input.
- New
  `document/infrastructure/persistence/prisma/prisma-admission-document.repository.ts`
  owns Prisma document persistence.
- New
  `document/infrastructure/storage/admission-file-storage.ts` adapts existing
  `StorageService` and `StorageKeyBuilder` without changing shared helpers.
- New
  `document/infrastructure/notification/admission-document-notification.adapter.ts`
  adapts the existing notification service.
- New `document/document.module.ts` owns document providers and exports only
  document operations and boundary ports.
- New `document/index.ts` is the intentional document public API.
- `document/dto/request/verify-document.dto.ts` moved to
  `document/presentation/http/dto/request/verify-document.dto.ts`.
- `document/use-cases/*.use-case.ts` moved into the application use-case
  directories.
- The document workflow test moved into the application use-case layer, and a
  public API seam test was added.
- Root admission wiring imports `DocumentModule`; applicant HTTP and admin HTTP
  consumers import document operations through `document/index.ts`.
- Payment upload reuses the document public storage and file-validation API.
- Document CRUD methods were removed from applicant/application repository
  contracts and their Prisma adapters; existing broad application methods used
  by other workflows remain unchanged.
- Payment file reference now uses the document-owned file reference type.

## Forbidden-Import Scans

Scanned `src/**/*.ts`:

- Stale document paths (`document/use-cases`, `document/dto`, old document
  entity paths, old payment file entity path): no matches.
- Document domain imports from Prisma, `PrismaService`, DTOs, or
  infrastructure: no matches.
- Document application imports from Prisma, `PrismaService`, DTOs, or HTTP
  presentation: no matches.
- Document presentation imports of Prisma, `PrismaService`, repositories, or
  infrastructure internals: no matches.

## Behavior Checks

- Upload keeps JPG, PNG, and PDF validation, 5 MB maximum, application lookup,
  editable-status check, active document-type lookup, existing storage key
  segments, and document/file persistence shape.
- Verification keeps rejection-note validation, application/document lookup,
  status persistence, notification type and messages, and returned update.
- Applicant upload route still uses `PUT admissions/my-application/documents/:typeCode`.
- Admin verification route still uses
  `PATCH admissions/applications/:id/documents/:docId/verify` and
  `admissions.verify`.
- Payment upload continues using shared file validation and existing
  `payments` storage segment.

## Commands And Results

- RED public API seam test before implementation: failed because document
  public API was absent, as expected.
- `pnpm test -- document --runInBand`: PASS, 2 suites, 2 tests.
- `pnpm test -- application/use-cases/admission-workflow.use-cases.spec.ts --runInBand`:
  PASS, 1 suite, 7 tests.
- `pnpm test -- app.module.boots.spec.ts route-conflicts.spec.ts route-collisions.spec.ts --runInBand`:
  PASS, 3 suites, 7 tests.
- `pnpm run format:check`: PASS.
- `pnpm run lint`: PASS, zero errors and warnings.
- `pnpm run lint:strict`: PASS, zero errors and warnings.
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- `pnpm test --runInBand`: PASS, 21 suites, 137 tests.
- `pnpm run validate`: PASS, format check, lint, typecheck, strict lint, full
  test, and build.
- Expected existing test logs: Node VM Modules experimental warning and
  fail-closed identity-service timeout/503 logs. Document test run also
  reported a Jest worker teardown warning after passing tests.

## Concerns

- Existing application and applicant workflows still consume broad repository
  operations for document type reads and application detail reads. Narrowing
  those contracts belongs to their later context slices and was not needed for
  document upload or verification behavior.
- Shared storage helpers were not redesigned; document infrastructure adapts
  them at the boundary as required.

## T007-T008 Review Corrections

- Removed `VerifyDocumentDto` from `document/index.ts`; the admin controller
  now imports it directly from
  `document/presentation/http/dto/request/verify-document.dto.js`.
- Removed empty legacy directories `document/dto/request/`, `document/dto/`,
  and `document/use-cases/`. No source files were removed.
- Confirmed `findDocument` and `updateDocumentStatus` occurred only in the
  workflow test mock declarations; removed both obsolete entries.
- Confirmed no behavior or DI wiring changes: document, workflow, boot, and
  route tests pass.

## Review Correction Evidence

- `pnpm test -- document --runInBand`: PASS, 2 suites, 2 tests.
- `pnpm test -- admission-workflow.use-cases.spec.ts --runInBand`: PASS, 1
  suite, 7 tests.
- `pnpm test -- app.module.boots.spec.ts route-conflicts.spec.ts route-collisions.spec.ts --runInBand`:
  PASS, 3 suites, 7 tests.
- `pnpm run typecheck`: PASS.
- `pnpm run lint`: PASS, zero errors and warnings.
- `pnpm run lint:strict`: PASS, zero errors and warnings.
- Forbidden-import scans: PASS. No stale `document/use-cases` or
  `document/dto` imports; no Prisma, DTO, infrastructure, presentation, or
  repository imports in the audited forbidden layers.
- Legacy-directory scan: PASS. `document/dto/**` and
  `document/use-cases/**` no longer exist.
- Obsolete workflow mock scan: PASS. No `findDocument` or
  `updateDocumentStatus` references remain in the workflow test.
