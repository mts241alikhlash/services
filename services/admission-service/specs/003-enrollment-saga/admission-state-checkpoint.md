# Admission State Checkpoint

## Scope

T004-T006 implement admission-side enrollment checkpointing only. Student-side
idempotency, `applicationId`, event broker, outbox, and student-service changes
are out of scope.

## Files

- `src/shared/domain/enums/admission-status.enum.ts`: added `ENROLLING`.
- `src/admission/application/domain/policies/admission-status.transitions.ts`:
  changed enrollment transitions to `ACCEPTED -> ENROLLING`,
  `ENROLLING -> ENROLLING | ENROLLED`, with `ENROLLED` terminal.
- `prisma/admission.prisma`: added `ENROLLING` to `AdmissionStatus`.
- `prisma/migrations/20260913000000_add_enrolling_status/migration.sql`: added
  PostgreSQL enum value `ENROLLING` after `ACCEPTED`.
- `src/admission/application/domain/repositories/admission-application-repository.ts`:
  added `setEnrolling(id)` and changed `markEnrolled` to accept
  `enrolledStudentId`.
- `src/admission/application/infrastructure/persistence/prisma/prisma-admission-application-repository.ts`:
  persists `ENROLLING`, then persists `ENROLLED` with `enrolledStudentId`.
  Existing read methods and null results remain unchanged.
- `src/admission/application/application/use-cases/enroll-applicant/enroll-applicant.use-case.ts`:
  validates before checkpointing, checkpoints accepted applications before the
  remote call, retries enrolling applications, completes locally only after
  remote success, and notifies after local completion.
- `src/admission/application/application/use-cases/admission-workflow.use-cases.spec.ts`:
  updated approved completion-call assertions to include `studentId`.
- `src/admission/application/domain/policies/enroll-as-student.rules.spec.ts`:
  removed obsolete type casts exposed by strict lint.

## State Transitions

```text
ACCEPTED -> ENROLLING
ENROLLING -> ENROLLING
ENROLLING -> ENROLLED
ACCEPTED -> ENROLLED        rejected
ENROLLED -> ENROLLING       rejected
```

Remote failure leaves application `ENROLLING`. Remote success followed by local
completion failure also leaves `ENROLLING`; retry calls student-service again,
as required by the admission-only scope.

## Verification

Commands run from `D:\Project\241 Apps\admission-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runTestsByPath src/admission/application/domain/policies/enroll-as-student.rules.spec.ts src/admission/application/application/use-cases/admission-workflow.use-cases.spec.ts
PASS: 2 suites, 29 tests.

pnpm exec prisma generate
PASS: Prisma Client v7.10.0 generated.

pnpm run typecheck
PASS: tsc --noEmit.

pnpm run lint
PASS: ESLint completed with zero warnings.

pnpm run lint:strict
PASS: strict ESLint completed with zero warnings.

pnpm run format:check
PASS: all source files use Prettier style.

pnpm exec prisma validate
PASS: Prisma schemas are valid.

pnpm run build
PASS: nest build.

pnpm test --runInBand
PASS: 23 suites, 151 tests. Existing mocked identity adapter tests logged expected 503 errors.

pnpm run validate
PASS: format check, lint, typecheck, strict lint, 23 suites / 151 tests, and build.
```

## Concerns

- Migration deployment was not run because no database deployment was requested
  and local database availability was not established. `prisma validate` and
  generated-client checks pass.
- `git status` is unavailable because `admission-service` is not a Git working
  tree in this workspace. No commit was created.
- Student-side idempotency remains T008 and is intentionally untouched.
