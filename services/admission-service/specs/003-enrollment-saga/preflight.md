# Enrollment Saga Preflight

## Scope

T001 inspected admission-service and student-service schemas, init migrations,
domain ports, HTTP adapters, request and response DTOs, repositories, writers,
workflow tests, and enrolment tests. T002 and T003 add RED tests only. No
production source, Prisma schema, or migration was changed.

## Findings

### `ENROLLING` migration requirement

`ENROLLING` needs a migration. It is absent from all admission status layers:

- `admission-service/src/shared/domain/enums/admission-status.enum.ts:1-9`
  exposes `DRAFT`, `SUBMITTED`, `REVISION_NEEDED`, `VERIFIED`, `ACCEPTED`,
  `REJECTED`, and `ENROLLED`, but not `ENROLLING`.
- `admission-service/src/admission/application/domain/policies/admission-status.transitions.ts:7-15`
  permits `ACCEPTED -> ENROLLED` and has no `ENROLLING` state or retry edge.
- `admission-service/prisma/admission.prisma:6-14` omits `ENROLLING` from the
  Prisma enum.
- `admission-service/prisma/migrations/20260904000000_init/migration.sql:8`
  creates `AdmissionStatus` without `ENROLLING`.

The migration is required because PostgreSQL enum values are database state,
not only TypeScript types. Existing `enrolledStudentId` storage is already
available at `admission.prisma:116-117`, with a unique index in
`20260904000000_init/migration.sql:220`.

### `userId` uniqueness and concurrency

Admission has unconditional application uniqueness by user:

- `admission-service/prisma/admission.prisma:77` declares
  `AdmissionApplication.userId @unique`.
- `admission-service/prisma/migrations/20260904000000_init/migration.sql:214`
  creates `admission_applications_user_id_key`.

Student has unconditional student uniqueness by user:

- `student-service/prisma/student.prisma:10` declares `Student.userId @unique`.
- `student-service/prisma/migrations/20260904000000_init/migration.sql:135`
  creates `students_user_id_key`.

These constraints prevent two committed student rows for one user, but they do
not make current concurrent requests converge to the same response. The path is
read-then-write:

- `student-service/src/student/application/use-cases/enrol-existing-account/enrol-existing-account.use-case.ts:16-27`
  checks `findByUserId` and returns an existing row only when the read sees it.
- `student-service/src/student/infrastructure/persistence/prisma/prisma-student.writer.ts:77-98`
  repeats the check inside the transaction, then calls `tx.student.create`.
- Two transactions can both observe no row; one create wins the unique index and
  the other receives a unique-constraint error. Current code does not catch that
  error and re-read the winning student.

Related database guarantees already exist:

- NIS uniqueness is a partial unique index at
  `student-service/prisma/student.prisma:21` and migration lines 144-145.
- NISN uniqueness is a partial unique index at
  `student-service/prisma/student.prisma:22` and migration lines 147-148.
- Active enrolment uniqueness per student and semester is declared at
  `student-service/prisma/enrollment.prisma:23` and migration lines 111-112.
- `identity-service/src/user/infrastructure/persistence/prisma/prisma-user.repository.ts:334-337`
  uses `userRole.upsert` on the composite primary key, so repeated STUDENT role
  assignment is already duplicate-safe.

### `applicationId` persistence and key

Admission already persists the operation's natural key as the application row
ID. No second admission column or operation table is needed for the minimum
saga. `EnrolApplicantUseCase.execute(applicationId, ...)` receives it at
`admission-service/src/admission/application/application/use-cases/enroll-applicant/enroll-applicant.use-case.ts:31-35`,
but `EnrolStudentInput` at
`admission-service/src/admission/application/infrastructure/integration/student-enrolment.port.ts:1-40`
does not carry it, and the HTTP adapter serializes that input unchanged at
`http-student-enrolment.adapter.ts:33-39`.

Student has no `applicationId` field or operation record. The request DTO at
`student-service/src/student/presentation/http/dto/request/enrol-existing-account.dto.ts:120-163`
also omits it. Therefore `applicationId` persistence is not currently
possible without a schema change, but request-key transport is additive and
does not require persistence in admission. A student-side persisted operation
record is not required if the existing `userId` unique constraint plus atomic
create conflict recovery is sufficient; it becomes necessary only if one user
must support multiple distinct admission operations with different payloads.

### Existing response compatibility

No response break is needed:

- Student response DTO already exposes `studentId`, `parentsLinked`,
  `enrollmentCreated`, and `alreadyEnrolled` at
  `student-service/src/student/presentation/http/dto/response/enrol-existing-account-response.dto.ts:3-17`.
- The controller keeps `POST /students/enrol` and returns that DTO at
  `student-service/src/student/presentation/http/student.controller.ts:74-87`.
- Admission adapter expects the existing `{ data: EnrolStudentResult }` body at
  `admission-service/src/admission/application/infrastructure/integration/http-student-enrolment.adapter.ts:50-68`.
- Admission currently returns the existing application result plus nested
  `student` fields at
  `admission-service/src/admission/application/application/use-cases/enroll-applicant/enroll-applicant.use-case.ts:129-137`.

New `applicationId` must be optional/additive for old callers. Existing NIS and
NISN conflict behavior must remain: the use case checks both before profile or
role writes at `student-service/src/student/application/use-cases/enrol-existing-account/enrol-existing-account.use-case.ts:29-38`,
and the database constraints remain the final race-safe guard.

## Smallest idempotency design

1. Add `ENROLLING` to admission TypeScript, transition policy, Prisma enum, and
   migration. Add repository operations that atomically move `ACCEPTED` to
   `ENROLLING` and complete `ENROLLED` with `enrolledStudentId`.
2. Forward optional `applicationId` from admission to student as an additive
   request field. Do not persist it yet: admission row ID already persists the
   operation identity, and adding a student operation table would exceed the
   proven need.
3. Keep the existing student `userId`, NIS, NISN, and active-enrolment unique
   constraints. Make the student transaction recover a losing `userId` create
   race by reading and returning the winning student. Keep the current
   `alreadyEnrolled` response shape.
4. Keep `assignRole` as the existing identity-service `upsert`; do not add role
   coordination in student-service.

This is the smallest design that handles repeated and concurrent retries for
one stable admission operation without a new table. Add a persisted operation
record only when product requirements allow multiple enrolment operations for
one user or require replaying a completed operation by `applicationId`.

## RED evidence

Commands run after adding T002 and T003 tests:

```bash
cd "D:\Project\241 Apps\admission-service"
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runTestsByPath src/admission/application/domain/policies/enroll-as-student.rules.spec.ts
# FAIL: 1 suite, 4 failed, 14 passed, 18 total.
# RED: ACCEPTED -> ENROLLING throws "Invalid status transition: ACCEPTED → ENROLLING";
#      ENROLLING lookups throw "Cannot read properties of undefined (reading 'includes')";
#      ACCEPTED -> ENROLLED does not throw as the new test requires.

pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runTestsByPath src/admission/application/application/use-cases/admission-workflow.use-cases.spec.ts
# FAIL: 1 suite, 3 failed, 8 passed, 11 total.
# RED: setEnrolling is called 0 times; ENROLLING retries fail in the transition
#      policy; retryable remote failure receives TypeError before remote call.

cd "D:\Project\241 Apps\student-service"
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runTestsByPath src/student/application/use-cases/enrol-existing-account/enrol-existing-account.use-case.spec.ts
# FAIL: 1 suite, 2 failed, 3 passed, 5 total.
# RED: repository input omits applicationId in both concurrent calls and in the
#      new-account call. Existing student return and NIS/NISN conflict checks pass.
```

Individual new-test commands also ran. `allows an accepted application to
enter enrolling`, `allows an enrolling application to retry`, `allows an
enrolling application to complete`, `rejects a direct accepted to enrolled
transition`, `persists enrolling before calling student-service`, `retries an
application already in enrolling`, `does not complete or notify when a
retryable remote call fails`, and `returns one student when repeated requests
race` produced the same expected RED failures. The new
`keeps enrolled terminal for enrollment` and `refuses a NISN taken by somebody
else` tests passed, confirming existing terminal/conflict behavior.

Expected RED cause: admission lacks `ENROLLING` in its enum/transition map and
does not persist `ENROLLING` before the remote call; student does not forward
`applicationId`, and current concurrent read-then-create handling has no loser
recovery.
