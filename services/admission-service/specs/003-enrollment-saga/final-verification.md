# Enrollment Saga Final Verification

Date: 2026-09-14

## Status

T010, T011, and T012 are complete. All T001-T012 task checkboxes are `[X]`.
The requirements checklist has 19/19 checked items.

No commits were created. The workspace root and both service directories are
not Git repositories in this environment, so Git status, diff, and log checks
cannot provide repository evidence.

## Fresh commands and results

Commands ran from `D:\Project\241 Apps\admission-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runInBand --runTestsByPath src/admission/application/domain/policies/enroll-as-student.rules.spec.ts src/admission/application/application/use-cases/admission-workflow.use-cases.spec.ts src/admission/application/infrastructure/integration/http-student-enrolment.adapter.spec.ts
```

Result: 3 suites passed, 31 tests passed, 0 failed, 0 snapshots.

```text
pnpm run validate
```

Result: format check passed; lint passed with 0 warnings; typecheck passed;
strict lint passed with 0 warnings; 24 suites passed; 153 tests passed; build
passed with exit code 0.

Commands ran from `D:\Project\241 Apps\student-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runInBand --runTestsByPath src/student/application/use-cases/enrol-existing-account/enrol-existing-account.use-case.spec.ts src/student/infrastructure/persistence/prisma/prisma-student.repository.enrol.spec.ts
```

Result: 2 suites passed, 7 tests passed, 0 failed, 0 snapshots.

```text
pnpm run validate
```

Result: format check passed; lint passed with 0 warnings; typecheck passed;
strict lint passed with 0 warnings; 63 suites passed; 392 tests passed; build
passed with exit code 0.

## State machine

- `ACCEPTED -> ENROLLING` is allowed.
- `ENROLLING -> ENROLLING` is allowed for retry after remote failure.
- `ENROLLING -> ENROLLED` is allowed after remote success and local admission
  persistence.
- `ENROLLED` is terminal; direct retry is rejected before student-service is
  called.
- Admission persists `ENROLLING` before the student-service request.
- Admission sends notification only after `markEnrolled` succeeds.
- Remote failure leaves admission incomplete and notification is not sent.
- Remote success followed by local admission failure can retry; student-service
  returns the existing student and admission completes on the retry.

Evidence: admission focused suite, 31/31 passed. The workflow suite covers
ordering, retryable remote failure, local post-remote failure, terminal
`ENROLLED`, and notification count.

## Contract

- Admission forwards optional `applicationId` in `POST /students/enrol`.
- Student validates optional `applicationId` as UUID.
- Existing request fields remain: `userId`, NIS, NISN, profile, parents,
  address, grade, and classroom.
- Existing response fields remain: `studentId`, `parentsLinked`,
  `enrollmentCreated`, and `alreadyEnrolled`.
- Repeated enrollment returns the existing `studentId` with
  `alreadyEnrolled: true`.

Evidence: HTTP adapter contract test passed. Student request DTO and response
DTO inspection matched the contract.

## Idempotency and conflict behavior

- Repeated same-user requests short-circuit on existing `userId`.
- Concurrent student creation uses the database unique `user_id` constraint;
  the losing `P2002` path re-reads the committed winner and returns it.
- `P2002` is discriminated by `user_id` target before treating it as a
  concurrent enrolment race.
- NIS and NISN pre-checks remain before profile, role, and student writes.
- NIS and NISN unique indexes remain the final race-safe guards.
- Active enrollment remains unique per student and semester.
- Identity STUDENT role assignment remains an existing idempotent upsert.

Evidence: student focused suite, 7/7 passed, including repeated requests,
concurrent race recovery, NIS conflict, NISN conflict, and non-user `P2002`
rethrow.

## Schema and migration inspection

Offline Prisma validation ran in both services:

```text
pnpm exec prisma validate --schema prisma/schema.prisma
```

Result: admission schema valid. Student schema valid.

Admission schema contains `ENROLLING`. Migration
`prisma/migrations/20260913000000_add_enrolling_status/migration.sql` adds it
after `ACCEPTED`. Existing `enrolled_student_id` storage and unique index remain
in the init migration. No student migration was added because existing
`students.user_id`, NIS, NISN, and active enrollment constraints plus P2002
recovery provide the required idempotency boundary.

Live migration status was attempted in both services:

```text
pnpm exec prisma migrate status --schema prisma/schema.prisma
```

Both returned `P1001: Can't reach database server at localhost:5433`.
No live database was available. Migration application order, applied state,
checksum state, and live upgrade behavior remain unverified. This is an
environment limitation, not a product test failure.

## Antislop comment scan

Focused changed-source/comment scan ran in both services with `rg` against the
enrollment saga files. The scan found 0 generic AI-slop comment findings:
0 decorative separators, 0 workflow-narration comments, 0 vague TODO/FIXME
comments, 0 empty labels, and 0 signature-echo comments.

The only retained comments found in the student scan were existing multiline
Prisma documentation for graduation holds in `prisma/enrollment.prisma`; they
explain domain distinctions and were not changed.

## Warnings

- Jest printed Node's `ExperimentalWarning` for VM modules.
- Full admission tests printed expected mocked identity-service timeout/503
  error logs while still passing.
- Full student tests printed expected mocked identity-service connection,
  500, and 503 error logs while still passing.
- No live PostgreSQL database was available at `localhost:5433`.

## Deferred defensive observation

`isUserIdUniqueViolation` currently accepts Prisma `P2002` metadata targets
`['user_id']` and `students_user_id_key`. Defensive handling for provider or
Prisma-version-specific target-name variants is deferred. If deployment shows
different target metadata, add a narrow adapter test and expand this predicate
without treating unrelated NIS, NISN, or enrollment conflicts as idempotent
success.
