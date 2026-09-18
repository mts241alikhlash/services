# Payment Layering Checkpoint

## Scope

Completed `T009-T010`. Payment proof upload and payment verification now use
explicit domain, application, infrastructure, and HTTP presentation
boundaries. Payment status transitions, proof validation, storage keys,
notification messages, permissions, routes, response serialization, and Prisma
persistence behavior remain unchanged.

## Exact Moves

- `payment/domain/entities/admission-payment.entity.ts` remains the payment
  entity and uses the document public file-reference type.
- `payment/domain/entities/admission-file.entity.ts` remains the payment file
  entity boundary.
- New `payment/domain/repositories/admission-payment-repository.ts` owns
  application/payment lookup, proof save, payment lookup, and status update
  contracts.
- New `payment/domain/repositories/admission-payment-notification.port.ts`
  owns the notification boundary used by payment verification.
- New `payment/application/serialize-payment.ts` owns payment response decimal
  serialization.
- New
  `payment/application/use-cases/upload-payment-proof/upload-payment-proof.use-case.ts`
  owns proof validation and upload orchestration.
- New
  `payment/application/use-cases/upload-payment-proof/upload-payment-proof.input.ts`
  contains the plain upload input.
- New
  `payment/application/use-cases/verify-payment/verify-payment.use-case.ts`
  owns rejection validation and verification orchestration.
- New
  `payment/application/use-cases/verify-payment/verify-payment.input.ts`
  contains the plain verification input.
- New
  `payment/infrastructure/persistence/prisma/prisma-admission-payment.repository.ts`
  owns all payment Prisma persistence, including the existing transaction that
  creates the proof file and updates payment status.
- New
  `payment/infrastructure/notification/admission-payment-notification.adapter.ts`
  adapts the existing notification service.
- New `payment/payment.module.ts` owns payment providers and exports only the
  two payment use cases.
- New `payment/index.ts` is the intentional payment public API. It exports no
  HTTP DTOs.
- `payment/dto/request/*.ts` moved to
  `payment/presentation/http/dto/request/*.ts`.
- `payment/use-cases/*.use-case.ts` moved into application use-case
  directories.
- New `payment/application/use-cases/payment-layering.seam.spec.ts` covers the
  public API and rejection-note validation.
- `admission/admission.module.ts` imports `PaymentModule`; applicant and admin
  HTTP consumers import payment operations through `payment/index.ts` and DTOs
  directly from payment presentation.
- Payment-specific lookup/save methods were removed from applicant and
  application repository contracts and their Prisma adapters.
- Payment application uses document's public `assertValidAdmissionFile`,
  `AdmissionUploadFile`, and `IAdmissionFileStorage` APIs.
- Empty legacy `payment/dto/` and `payment/use-cases/` directories were
  removed.

## Forbidden-Import Scans

Scanned `src/**/*.ts`:

- Stale payment paths (`payment/dto`, `payment/use-cases`): no matches.
- Payment domain imports from Prisma or HTTP DTOs: no matches.
- Payment application imports from Prisma or HTTP DTOs: no matches.
- Payment presentation imports of repositories, Prisma, or infrastructure:
  no matches.
- Payment public API HTTP DTO exports: no matches.

Expected Prisma matches remain only in payment infrastructure:
`payment.module.ts` imports the Prisma adapter, and the adapter imports
`PrismaService`.

## Behavior Checks

- Upload keeps JPG, PNG, and PDF validation and the existing 5 MB limit through
  the document public helper.
- Upload keeps application ownership lookup, DRAFT/NEEDS_REVISION guard,
  VERIFIED guard, `payments` storage segment, file metadata, PENDING status,
  proof replacement, and response decimal serialization.
- Verification keeps VERIFIED/REJECTED input restriction, rejection-note
  validation, missing-proof conflict, status/note/admin persistence,
  verification timestamp, notification type/messages, and response shape.
- Applicant upload route remains `PUT admissions/my-application/payment`.
- Admin verification route remains
  `PATCH admissions/applications/:id/payment/verify` with
  `admissions.verify`.

## Commands And Results

- `pnpm run format:check`: PASS.
- `pnpm run lint`: PASS, zero errors and warnings.
- `pnpm run lint:strict`: PASS, zero errors and warnings.
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- Focused payment/workflow/boot Jest run: PASS, 3 suites, 10 tests.
- Full Jest command exited 0. Jest configuration reported no summary for the
  no-argument package invocation; `jest --listTests` confirmed 22 test suites.
- Dependency scans: PASS. No stale payment paths, no Prisma/DTO imports in
  payment domain/application, and no repository/Prisma imports in payment
  presentation.
- Existing expected test logs: Node VM Modules experimental warning and
  fail-closed identity-service timeout/503 logs.

## Concerns

- Mixed applicant/admin controllers remain outside `payment/presentation/http`
  because they own routes for multiple admission contexts. Their payment
  dependencies now cross only the payment public API; payment DTOs remain in
  payment presentation.
- Payment application continues to reuse the existing application status
  policy until the scheduled application-context migration.
