# Final Verification

## T016

Verification run on 2026-09-13 after fixing a runtime Nest module cycle exposed
by the fresh full test run. The fix changes only module import paths and removes
three application public-barrel imports from applicant use cases. Providers,
routes, DTO validation, persistence, status behavior, and integration behavior
were not changed.

## Required Gates

| Command | Result | Exact evidence |
| --- | --- | --- |
| `pnpm run format:check` | PASS | `All matched files use Prettier code style!` |
| `pnpm run lint` | PASS | ESLint exited 0 with `--max-warnings=0`; no output/errors |
| `pnpm run typecheck` | PASS | `tsc --noEmit` exited 0 |
| `pnpm run lint:strict` | PASS | strict ESLint exited 0 with `--max-warnings=0`; no output/errors |
| `pnpm test` | PASS | 23 suites passed, 142 tests passed, 0 failed |
| Direct ESM Jest: `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --passWithNoTests` | PASS | 23 suites passed, 142 tests passed, 0 failed |
| `pnpm run build` | PASS | `nest build` exited 0 |
| `pnpm run validate` | PASS | format check, lint, typecheck, strict lint, 23 suites/142 tests, and build all passed |

## Focused Boot Evidence

`pnpm test -- app.module.boots.spec.ts route-conflicts.spec.ts
route-collisions.spec.ts --runInBand`

- PASS, 3 suites, 7 tests.
- Confirms `AppModule` dependency resolution and route registration after the
  barrel-cycle fix.

The package wrapper inserted an extra `--` before focused arguments. Direct ESM
Jest was run without that wrapper forwarding issue and passed in full.

## Warnings And Logs

- `pnpm test` emitted 3 copies of Node's existing
  `ExperimentalWarning: VM Modules is an experimental feature and might change
  at any time`.
- Direct ESM Jest emitted 3 copies of the same Node experimental warning.
- `pnpm run validate` emitted 3 copies of the same Node experimental warning.
- Full tests emitted 3 existing fail-closed external-service log lines:
  `identity-service request failed or timed out` and `identity-service answered
  503`.
- Direct ESM Jest emitted the same 3 external-service log lines.
- No Jest test failed because of those warnings/logs.
- `pnpm run validate` emitted the same 3 external-service log lines.
- No build, formatter, linter, or typechecker warnings were emitted.

## Repeated Structural Scans

All scans covered `src/**/*.ts` or the complete `src/admission/` tree as noted.

| Scan | Result |
| --- | --- |
| Stale legacy source imports for old use-case, DTO, interface, Prisma-adapter, and controller paths | PASS, 0 matches |
| Domain/application forbidden Prisma, `PrismaService`, DTO, HTTP, and infrastructure imports | PASS, 0 forbidden matches in audited layers |
| Presentation repository, Prisma, and infrastructure-internal imports | PASS, 0 forbidden matches in audited presentations |
| Forbidden application/document/applicant/payment/notification/announcement legacy paths | PASS, 0 matches |
| Context public API imports | PASS, only documented intentional cross-context imports remain |
| Empty directory scan under `src/admission/` | PASS, `NO_EMPTY_DIRECTORIES` |
| Legacy directory scan | PASS, `NO_LEGACY_DIRECTORIES` |

Valid internal layer paths such as `application/use-cases/` and presentation
DTO paths were excluded from stale-path scans. Their presence is required by
the target layout.

## Seven Intentional Direct-Import Exceptions

These are the seven exceptions retained by T015. Each has a concrete cycle or
composite-controller reason and does not expose a forbidden public API.

1. `src/admission/applicant/infrastructure/persistence/prisma/prisma-admission-applicant.repository.ts` imports `applicationDetailInclude` and `ApplicationDetail` from `application/infrastructure/persistence/prisma/prisma-admission-application.includes.ts` because applicant Prisma persistence reuses the shared application query shape.
2. `src/admission/applicant/infrastructure/persistence/prisma/prisma-admission-applicant.repository.ts` imports `attachParentReferences` and `resolveAcademicYearNames` from `application/infrastructure/persistence/prisma/prisma-admission.refs.ts` because applicant Prisma persistence reuses application reference-resolution helpers.
3. `src/admission/application/presentation/http/admission-admin.controller.ts` imports `VerifyDocumentDto` from `document/presentation/http/dto/request/verify-document.dto.ts` because one composite admin controller owns the existing document verification route.
4. `src/admission/application/presentation/http/admission-admin.controller.ts` imports `VerifyPaymentDto` from `payment/presentation/http/dto/request/verify-payment.dto.ts` because one composite admin controller owns the existing payment verification route.
5. `src/admission/applicant/presentation/http/admission-applicant.controller.ts` imports `UploadPaymentProofDto` from `payment/presentation/http/dto/request/upload-payment-proof.dto.ts` because one composite applicant controller owns the existing payment upload route.
6. `src/admission/document/application/use-cases/upload-admission-document/upload-admission-document.use-case.ts` imports `isEditable` from `application/domain/policies/admission-status.transitions.ts` because document upload shares the existing application editability policy without importing the application barrel.
7. `src/admission/payment/application/use-cases/upload-payment-proof/upload-payment-proof.use-case.ts` imports `isEditable` from `application/domain/policies/admission-status.transitions.ts` because payment upload shares the existing application editability policy without importing the application barrel.

The module wiring uses direct `*.module.ts` imports where needed. Public API
barrels remain for intentional cross-context use-case and type access. This
prevents runtime barrel cycles while preserving the public boundary.

## Task Evidence

T001-T015 remain checked because their checkpoint files record their slice
implementation, focused tests, gates, cleanup, and T015 scan evidence. T016 is
checked only after this fresh final verification.

All task checkboxes in `tasks.md` are checked: T001 through T016.
