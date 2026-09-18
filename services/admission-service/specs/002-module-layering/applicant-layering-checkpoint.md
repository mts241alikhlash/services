# Applicant Layering Checkpoint

## Scope

Completed `T005-T006`. Stage 1 inventory defined four applicant use cases, not
five. Routes, permission behavior, DTO validation, response serialization,
status codes, registration provisioning, reference lookup, self-service
updates, submission checks, notification behavior, and persistence operations
remain unchanged.

## Exact Moves

- `applicant/domain/interfaces/admission-applicant-repository.interface.ts` ->
  `applicant/domain/repositories/admission-applicant-repository.ts`
- `applicant/infrastructure/persistence/prisma-admission-applicant.repository.ts`
  -> `applicant/infrastructure/persistence/prisma/prisma-admission-applicant.repository.ts`
- `applicant/dto/request/register-applicant.dto.ts` ->
  `applicant/presentation/http/dto/request/register-applicant.dto.ts`
- `applicant/dto/request/update-my-application.dto.ts` ->
  `applicant/presentation/http/dto/request/update-my-application.dto.ts`
- `applicant/use-cases/register-applicant.use-case.ts` ->
  `applicant/application/use-cases/register-applicant/register-applicant.use-case.ts`
- `applicant/use-cases/get-my-application.use-case.ts` ->
  `applicant/application/use-cases/get-my-application/get-my-application.use-case.ts`
- `applicant/use-cases/update-my-application.use-case.ts` ->
  `applicant/application/use-cases/update-my-application/update-my-application.use-case.ts`
- `applicant/use-cases/submit-application.use-case.ts` ->
  `applicant/application/use-cases/submit-application/submit-application.use-case.ts`
- `applicant/use-cases/admission-applicant.use-cases.spec.ts` ->
  `applicant/application/use-cases/admission-applicant.use-cases.spec.ts`
- `admission/presentation/admission-public.controller.ts` ->
  `applicant/presentation/http/admission-public.controller.ts`
- `admission/presentation/admission-applicant.controller.ts` ->
  `applicant/presentation/http/admission-applicant.controller.ts`
- New plain input types:
  `applicant/application/use-cases/register-applicant/register-applicant.input.ts`
  and `applicant/application/use-cases/update-my-application/update-my-application.input.ts`.
- New `applicant/applicant.module.ts` owns applicant repository, Prisma adapter,
  four applicant use cases, and the existing notification service provider used
  by applicant workflows. Root composition registers moved HTTP controllers
  because those controllers also consume document, payment, notification, and
  announcement operations whose modules do not exist until later slices.
- New `applicant/index.ts` exposes applicant module, repository port, four use
  cases, and intentional boundary types.
- `admission/admission.module.ts` imports `ApplicantModule` and no longer owns
  applicant repository, Prisma adapter, or applicant use-case providers.
- Cross-context applicant repository consumers use `applicant/index.ts`.
- Notification service keeps a direct domain-port import to avoid a runtime
  barrel cycle with applicant submission.

## Forbidden-Import Scans

Scanned `src/**/*.ts`:

- Stale applicant paths (`applicant/use-cases`, `applicant/dto`,
  `applicant/domain/interfaces`, old applicant Prisma path, old audience
  controller paths): no matches.
- Applicant domain imports from presentation, DTO, Prisma, or `PrismaService`:
  no matches.
- Applicant application imports from DTO, Prisma, or `PrismaService`: no
  matches.
- Applicant presentation imports of repository, Prisma, or infrastructure
  internals: no matches.

## Cleanup

- Removed empty legacy directories: `applicant/domain/interfaces/`,
  `applicant/dto/request/`, `applicant/dto/`, and `applicant/use-cases/`.
- Re-ran stale-path and forbidden-import scans after cleanup: no matches in
  active source files.

The broad cross-context scan still finds expected Stage 1 internals in the
unmigrated document, payment, and application contexts. Applicant Prisma
infrastructure still reads application persistence helpers by Stage 1 design;
this is an infrastructure-only dependency and remains scheduled for later
context slices.

## Behavior Checks

- Registration lower-cases identifier, rejects password mismatch, rejects
  closed waves and duplicate identifiers, hashes password, provisions account,
  and returns existing response fields.
- Self-service read returns serialized application detail and active document
  types.
- Self-service update keeps editable-status guard and parent/date normalization
  at HTTP boundary.
- Submission keeps transition, wave, required field, parent, document, and
  payment checks, persistence update, notification, and serialized response.
- Existing mixed applicant audience routes remain registered under the same
  paths and continue to use document, payment, notification, and announcement
  operations.

## Commands And Results

- RED seam test before implementation: failed because applicant public API was
  absent, as expected.
- `pnpm test -- applicant --runInBand`: PASS, 2 suites, 8 tests.
- `pnpm test -- app.module.boots.spec.ts --runInBand`: PASS, 1 suite, 1 test.
- `pnpm run format:check`: PASS.
- `pnpm run lint`: PASS, zero errors and warnings.
- `pnpm run lint:strict`: PASS, zero errors and warnings.
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- `pnpm run validate`: PASS, 20 suites, 136 tests, and build.
- Expected existing test logs: Node VM Modules experimental warning and
  fail-closed identity-service timeout/503 logs.

## Concerns

- Stage 1 intentionally keeps broad applicant repository operations for
  document, payment, notification, wave, and announcement consumers.
- Applicant infrastructure still imports application Prisma include/reference
  helpers until application context migration.
- Mixed audience controllers remain root-registered but applicant
  presentation-owned because Stage 1 maps those controllers as applicant
  references while document, payment, and notification modules do not yet
  exist.
